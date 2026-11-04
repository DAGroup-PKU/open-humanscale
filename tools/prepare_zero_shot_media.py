#!/usr/bin/env python3
"""Prepare the twenty supplied processed zero-shot recordings for the website.

Usage: python3 tools/prepare_zero_shot_media.py --source /path/to/processed

Requires ffmpeg and ffprobe. No Python packages are needed. The complete video
stream and its timestamps are retained, audio is omitted, and small inputs are
not enlarged. Camera labels were checked against sampled source frames. The
source's playback speed is preserved, without claiming it is real-time footage.
"""

import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess


# Display order interleaves task categories. Poster positions are fractions of
# the supplied video duration and were selected from reviewed source frames.
# source, id, title, category, camera, poster fraction, optional existing demo
CLIPS = [
    ("拿两瓶水.mp4", "zero-water-bottles", "Bimanual bottle lifting", "coordination", "robot", .75, "zero-bottles"),
    ("杯子放在杯垫上-夹把手.mp4", "zero-mug-handle", "Mug placement · handle grasp", "precision", "robot", .72, "zero-mug"),
    ("叠方块.mp4", "zero-block-stack", "Block stacking", "placement", "third-person", .80, None),
    ("开抽屉.mp4", "zero-drawer-open", "Drawer opening", "articulation", "third-person", .70, None),
    ("倒饮料.mp4", "zero-drink-pour", "Pouring a drink", "precision", "robot", .80, None),
    ("叠碗.mp4", "zero-bowl-stack", "Bowl stacking", "placement", "third-person", .75, None),
    ("抓两瓶饮料1.mp4", "zero-two-drinks-1", "Lifting two drinks · example 1", "coordination", "third-person", .85, None),
    ("鸡蛋和球分别放左右碗.mp4", "zero-egg-ball-sort", "Sorting an egg and a ball", "placement", "robot", .67, "zero-sort"),
    ("抽屉放螺丝刀.mp4", "zero-screwdriver-drawer", "Screwdriver placement in a drawer", "articulation", "robot", .65, None),
    ("杯子放在杯垫上-夹瓶身.mp4", "zero-mug-body", "Mug placement · body grasp", "precision", "robot", .72, None),
    ("书本收纳.mp4", "zero-book-storage", "Book organization", "placement", "robot", .65, None),
    ("抓两瓶饮料2.mp4", "zero-two-drinks-2", "Lifting two drinks · example 2", "coordination", "third-person", .85, None),
    ("胶棒放到笔筒.mp4", "zero-glue-placement", "Glue-stick placement", "precision", "robot", .70, "zero-glue"),
    ("排列方块.mp4", "zero-block-lineup", "Block arrangement", "placement", "third-person", .75, None),
    ("排序换手.mp4", "zero-object-handover", "Bimanual object handling", "coordination", "robot", .50, "zero-handover"),
    ("方块放到书堆上.mp4", "zero-block-on-books", "Block placement on books", "placement", "robot", .70, "zero-stack"),
    ("推碗.mp4", "zero-bowl-push", "Bowl repositioning", "precision", "third-person", .70, None),
    ("放鸡蛋.mp4", "zero-egg-placement", "Egg placement", "precision", "robot", .65, None),
    ("定位.mp4", "zero-positioning-a", "Bottle positioning · A", "precision", "robot", .50, None),
    ("定位2.mp4", "zero-positioning-b", "Bottle positioning · B", "precision", "robot", .50, None),
]


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(path),
    ]))


def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def video(info):
    return next(s for s in info["streams"] if s["codec_type"] == "video")


def frame_times(path):
    data = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_frames", "-show_entries", "frame=best_effort_timestamp_time",
        "-of", "json", str(path),
    ]))
    times = [float(frame["best_effort_timestamp_time"]) for frame in data["frames"]]
    return [value - times[0] for value in times]


def prepare(spec, source, root):
    filename, clip_id, title, category, camera, fraction, legacy_id = spec
    src = source / filename
    dst = root / "assets/videos/zero-shot" / f"{clip_id}.mp4"
    poster = root / "assets/posters/zero-shot" / f"{clip_id}.jpg"
    before = probe(src)
    stream = video(before)
    subprocess.run([
        "ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src),
        "-map", "0:v:0", "-an", "-map_metadata", "-1",
        "-vf", "scale='min(1280,iw)':-2,setsar=1",
        "-c:v", "libx264", "-preset", "fast", "-crf", "25",
        "-pix_fmt", "yuv420p", "-threads", "2",
        "-fps_mode:v", "passthrough", "-enc_time_base:v", "demux",
        "-movflags", "+faststart", str(dst),
    ], check=True)
    after = probe(dst)
    output_stream = video(after)
    original_times = frame_times(src)
    output_times = frame_times(dst)
    if len(original_times) != len(output_times):
        raise RuntimeError(f"{filename}: video frame count changed")
    if any(abs(a - b) > .0001 for a, b in zip(original_times, output_times)):
        raise RuntimeError(f"{filename}: video timestamps changed")
    if output_stream["width"] > stream["width"] or output_stream["height"] > stream["height"]:
        raise RuntimeError(f"{filename}: smaller source enlarged")
    # Fully decode each exported video, so a successful encode alone is not the
    # only integrity check for the files that will be published.
    subprocess.run([
        "ffmpeg", "-nostdin", "-v", "error", "-xerror", "-i", str(dst),
        "-map", "0:v:0", "-f", "null", "-",
    ], check=True)
    duration = float(output_stream.get("duration", after["format"]["duration"]))
    poster_time = duration * fraction
    subprocess.run([
        "ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(poster_time),
        "-i", str(dst), "-frames:v", "1", "-vf", "scale='min(960,iw)':-2",
        "-q:v", "3", str(poster),
    ], check=True)
    entry = {
        "id": clip_id,
        "title": title,
        "category": category,
        "src": str(dst.relative_to(root)),
        "poster": str(poster.relative_to(root)),
        "source_name": filename,
        "duration": round(duration, 6),
        "playback_note": "Source playback speed preserved.",
        "source_sha256": sha(src),
        "output_sha256": sha(dst),
        "camera_view": camera,
        "dimensions": [output_stream["width"], output_stream["height"]],
        "frame_rate": output_stream["avg_frame_rate"],
        "frame_count": len(output_times),
        "poster_time": round(poster_time, 3),
        "size_bytes": dst.stat().st_size,
    }
    if legacy_id:
        entry["legacy_id"] = legacy_id
    if clip_id == "zero-positioning-b":
        entry["note"] = "Positioning example; the complete supplied clip includes the bottle tipping after release."
    print(f"{clip_id}: {duration:.2f}s, {dst.stat().st_size / 1024**2:.2f} MiB; {len(output_times)} frames preserved", flush=True)
    return entry


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--site", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    source = args.source.resolve()
    root = args.site.resolve()
    expected = {row[0] for row in CLIPS}
    actual = {path.name for path in source.glob("*.mp4")}
    if actual != expected:
        parser.error(f"Source recordings do not match the reviewed set. Missing: {expected-actual}; additional: {actual-expected}")
    for folder in ("assets/videos/zero-shot", "assets/posters/zero-shot"):
        (root / folder).mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        entries = list(pool.map(lambda spec: prepare(spec, source, root), CLIPS))
    manifest = {
        "revision": 1,
        "description": "Twenty complete supplied processed zero-shot recordings. Camera viewpoint and source timing preserved; audio omitted for muted web playback.",
        "clips": entries,
    }
    (root / "assets/zero-shot-gallery.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Prepared {len(entries)} clips; {sum(item['size_bytes'] for item in entries)/1024**2:.2f} MiB video", flush=True)


if __name__ == "__main__":
    main()
