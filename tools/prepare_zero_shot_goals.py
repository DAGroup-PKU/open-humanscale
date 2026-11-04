#!/usr/bin/env python3
"""Extract verified input goals from the fixed goal pane in source recordings."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

SOURCES = {
    'zero-water-bottles': '左右手各拿一瓶水/拿两瓶水.mp4',
    'zero-mug-handle': '杯子放在杯垫上——夹杯把儿版/拿杯子-1.mp4',
    'zero-mug-body': '杯子放在杯垫上——夹瓶身版/拿杯子-2-1.mp4',
    'zero-book-storage': '书本收纳/移动书.mp4',
    'zero-screwdriver-drawer': '抽屉放螺丝刀——后续出现推抽屉的动作/抽屉放螺丝刀-1.mp4',
    'zero-object-handover': '排序——出现“换手”的双手协作/排序换手-1.mp4',
    'zero-block-on-books': '方块放到书堆上/方块放到书堆上.mp4',
    'zero-glue-placement': '胶棒放到笔筒里 ——根据goal image有笔筒位置调整/胶棒放到笔筒_.mp4',
    'zero-egg-ball-sort': '鸡蛋和球分别放左右碗/鸡蛋和球分别放左右碗-第一视角.mp4',
    'zero-positioning-a': '定位/10月31日 (5)(1).mp4',
    'zero-positioning-b': '定位2/10月31日 (5).mp4',
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path, help='Original videos/zero-shot directory')
    parser.add_argument('--site', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    site = args.site.resolve()
    manifest = site / 'assets/zero-shot-gallery.json'
    data = json.loads(manifest.read_text())
    output = site / 'assets/goals/zero-shot'
    output.mkdir(parents=True, exist_ok=True)
    for clip in data['clips']:
        relative = SOURCES.get(clip['id'])
        if not relative:
            continue  # No substitute images or missing-goal notices.
        source = args.source / relative
        destination = output / (clip['id'] + '.webp')
        # Same reviewed crop as the positioning goals: remove only UI labels/border.
        with tempfile.TemporaryDirectory() as temporary:
            frame = Path(temporary) / 'goal.png'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-i', str(source),
                            '-frames:v', '1', '-vf', 'crop=632:304:4:30', str(frame)], check=True)
            subprocess.run(['cwebp', '-quiet', '-q', '92', str(frame), '-o', str(destination)], check=True)
        clip['goal'] = {
            'src': str(destination.relative_to(site)), 'width': 632, 'height': 304,
            'source': 'videos/zero-shot/' + relative,
            'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'time_seconds': 1, 'crop_xywh': [4, 30, 632, 304],
            'provenance': 'Fixed input-goal pane in the original interface recording.',
        }
    data['revision'] = 2
    manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Added {sum('goal' in clip for clip in data['clips'])} verified goals to {len(data['clips'])} recordings.")


if __name__ == '__main__':
    main()
