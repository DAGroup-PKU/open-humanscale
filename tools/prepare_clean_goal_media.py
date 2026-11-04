"""Rebuild goal comparisons as clean execution-only videos.

Uses the reviewed source intervals and camera retiming in goal-edit-manifest.json.
The goal image, task text, and speed label are rendered by the webpage instead of
being burned into the video. Requires ffmpeg/ffprobe and cwebp; no Python packages.

Usage: python3 tools/prepare_clean_goal_media.py --paper-dir /path/to/paper
"""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
import hashlib
import json
import math
import subprocess
from tempfile import TemporaryDirectory


def run(*args):
    subprocess.run([str(arg) for arg in args], check=True)


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
        "format=duration,size:stream=width,height,avg_frame_rate,nb_frames",
        "-of", "json", str(path),
    ]))


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def prepare(entry, root, paper):
    name = entry["id"]
    source = (root if entry["source_base"] == "dist" else paper) / entry["source"]
    if sha(source) != entry["source_sha256"]:
        raise ValueError(f"Source has changed since review: {name}")
    start, end = entry["source_interval_seconds"]
    speed = entry["playback_speed_relative_to_source"]
    frames = math.ceil((end - start) / speed * 25 - 1e-6)
    output = root / f"assets/videos/clean-goals/{name}.mp4"
    poster = root / f"assets/posters/clean-goals/{name}.webp"
    filters = [entry["source_crop"]] if entry.get("source_crop") else []
    filters += [
        f"setpts=(PTS-STARTPTS)/{speed:.12f}",
        "fps=25",
        # At most one resampling frame, as in the reviewed source renderer.
        # There is no editorial final-frame hold or intro.
        "tpad=stop_mode=clone:stop_duration=0.04",
        f"trim=end_frame={frames}",
        "scale=w='min(1280,iw)':h=-2",
        "setsar=1",
    ]
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", start,
        "-t", end - start, "-i", source, "-vf", ",".join(filters),
        "-c:v", "libx264", "-preset", "fast", "-crf", "24",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
        "-threads", "2", "-y", output)
    metadata = probe(output)
    video = metadata["streams"][0]
    if int(video["nb_frames"]) != frames:
        raise ValueError(f"Unexpected frame count for {name}: {video['nb_frames']} / {frames}")
    with TemporaryDirectory(prefix="clean-goal-poster-") as temporary:
        image = Path(temporary) / "poster.png"
        run("ffmpeg", "-v", "error", "-ss", min(2, frames / 75), "-i", output,
            "-frames:v", "1", "-vf", "scale=w='min(960,iw)':h=-2",
            "-threads", "2", "-y", image)
        run("cwebp", "-quiet", "-q", "87", image, "-o", poster)
    run("ffmpeg", "-v", "error", "-xerror", "-i", output, "-map", "0:v:0",
        "-f", "null", "-")
    speed_label = "Original speed" if abs(speed - 1) < 1e-8 else f"{speed:.2f}× source speed"
    notes = entry.get("notes", "").replace(
        "adjusted playback speed is shown in the video", "adjusted playback speed is shown by the webpage")
    print(f"{name}: {frames / 25:.2f}s, {speed_label}", flush=True)
    return {
        "id": name,
        "src": output.relative_to(root).as_posix(),
        "poster": poster.relative_to(root).as_posix(),
        "speedLabel": speed_label,
        "duration": float(metadata["format"]["duration"]),
        "view": entry["view"],
        "target": entry["target"],
        "source": entry["source"],
        "source_base": entry["source_base"],
        "source_sha256": entry["source_sha256"],
        "source_interval_seconds": [start, end],
        "source_crop": entry.get("source_crop"),
        "playback_speed_relative_to_source": speed,
        "action_aligned_pair": entry.get("action_aligned_pair"),
        "alignment_basis": entry.get("alignment_basis"),
        "alignment_note": entry.get("alignment_note"),
        "goal_image": entry["goal_image"],
        "dimensions": [video["width"], video["height"]],
        "fps": 25,
        "frames": frames,
        "intro_duration_seconds": 0,
        "final_frame_hold_seconds": 0,
        "output_sha256": sha(output),
        "notes": notes,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--paper-dir", type=Path, required=True)
    parser.add_argument("--site-root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root, paper = args.site_root.resolve(), args.paper_dir.resolve()
    for relative in ("assets/videos/clean-goals", "assets/posters/clean-goals"):
        (root / relative).mkdir(parents=True, exist_ok=True)
    reviewed = json.loads((root / "assets/goal-edit-manifest.json").read_text())
    entries = [entry for entry in reviewed["clips"] if entry["id"] != "overview"]
    with ThreadPoolExecutor(max_workers=2) as pool:
        clips = list(pool.map(lambda entry: prepare(entry, root, paper), entries))
    for clip in clips:
        if clip["id"].endswith("-ego"):
            other = next(item for item in clips if item["id"] == clip["id"][:-4])
            if clip["frames"] != other["frames"]:
                raise ValueError(f"Camera pair durations differ: {clip['id']}")
    manifest = {
        "revision": 1,
        "description": "Clean execution views with the reviewed intervals and camera retiming preserved. Goals and speed labels are displayed by the webpage.",
        "generator": "tools/prepare_clean_goal_media.py",
        "clips": clips,
    }
    (root / "assets/clean-goal-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Verified {len(clips)} clips and six equal-duration camera pairs.")


if __name__ == "__main__":
    main()
