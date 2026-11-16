"""Package each reviewed range independently, preserving the original Opus packets.

This avoids browser-dependent seeking deep into a long data-URL Ogg stream.
FFmpeg stream-copies at packet boundaries inside the reviewed silent pauses.
"""
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile


def probe(path):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'a', '-show_packets',
        '-show_data_hash', 'sha256', '-show_format', '-show_entries', 'packet=pts_time,data_hash:format=start_time,duration',
        '-of', 'json', str(path)]))


def package(audio_path, clips):
    original = probe(audio_path)['packets']
    positions = {p['data_hash']: i for i, p in enumerate(original)}
    sources, report = {}, []
    with tempfile.TemporaryDirectory(prefix='kena_sections_') as directory:
        command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', str(audio_path)]
        for clip in clips:
            command += ['-map', '0:a:0', '-ss', str(clip['start']),
                        '-t', str(clip['end'] - clip['start']), '-c:a', 'copy',
                        '-fflags', '+bitexact', str(Path(directory) / (clip['number'] + '.webm'))]
        subprocess.run(command, check=True)
        for clip in clips:
            path = Path(directory) / (clip['number'] + '.webm')
            info = probe(path)
            copied = info['packets']
            index = positions[copied[0]['data_hash']]
            assert [p['data_hash'] for p in copied] == [p['data_hash'] for p in original[index:index + len(copied)]], 'Audio packets changed: ' + clip['number']
            # Both streams retain the same Opus pre-skip. Their first-packet
            # timestamp difference maps the local media clock to source time.
            offset = float(original[index]['pts_time']) - float(copied[0]['pts_time'])
            assert abs(offset - clip['start']) < .021, 'Cut outside the reviewed pause: ' + clip['number']
            duration = float(info['format']['duration'])
            assert abs(offset + duration - clip['end']) < .04, 'Section ending outside the reviewed pause: ' + clip['number']
            content = path.read_bytes()
            sources[clip['number']] = dict(offset=round(offset, 6), src='data:audio/webm;codecs=opus;base64,' + base64.b64encode(content).decode())
            report.append(dict(number=clip['number'], start=clip['start'], end=clip['end'], offset=round(offset, 6), duration=duration, packagedEnd=round(offset + duration, 6), packets=len(copied), sha256=hashlib.sha256(content).hexdigest(), originalPacketsUnchanged=True))
    return sources, report
