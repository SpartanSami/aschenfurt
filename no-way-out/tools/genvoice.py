# Erzeugt Sprachaufnahmen über die ElevenLabs-API (Zugang über den Session-Proxy) und bearbeitet sie mit ffmpeg.
import json, os, subprocess, sys, urllib.request
RAW = sys.argv[1]
OUT = 'assets/audio'
only = set(sys.argv[2:])
lines = json.load(open('tools/out/voicelines.json'))
# Vorgefertigte ElevenLabs-Stimmen (im Gratis-Tarif per API nutzbar), Modell multilingual v2 spricht Deutsch
VOICE = {'fragment': 'cjVigY5qzO86Huf0OWal', 'unknown': 'cjVigY5qzO86Huf0OWal', 'pa': 'EXAVITQu4vr4xnSDxMaL', 'military': 'onwK4e9ZLuTAKqWW03F9'}
SET = {
  'fragment': {'stability': 0.42, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True},
  'unknown': {'stability': 0.55, 'similarity_boost': 0.8, 'style': 0.15, 'use_speaker_boost': True},
  'pa': {'stability': 0.85, 'similarity_boost': 0.7, 'style': 0.0, 'use_speaker_boost': False},
  'military': {'stability': 0.7, 'similarity_boost': 0.75, 'style': 0.2, 'use_speaker_boost': True},
}
FX = {
  # verzerrte Stimme am Telefon: tiefer, Bandpass, Bitcrusher
  'unknown': 'asetrate=44100*0.84,aresample=44100,atempo=1.19,acrusher=bits=7:mode=log:aa=1:mix=0.3,highpass=f=280,lowpass=f=3300,volume=1.8',
  'fragment': 'highpass=f=110,lowpass=f=7500,acompressor=threshold=-18dB:ratio=3,volume=1.2',
  'pa': 'highpass=f=220,lowpass=f=5200,aecho=0.8:0.6:70|140:0.25|0.15,volume=1.3',
  'military': 'highpass=f=480,lowpass=f=3600,acrusher=bits=10:mode=log:aa=1:mix=0.2,aecho=0.8:0.7:280|520:0.35|0.2,volume=1.6',
}
os.makedirs(OUT, exist_ok=True)
used = 0
for l in lines:
  if only and l['id'] not in only: continue
  raw = os.path.join(RAW, l['id'] + '.mp3')
  if not os.path.exists(raw):
    text = l['t'].replace('İlyas', 'Ilyas').replace('…', '...')
    body = json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2', 'voice_settings': SET[l['s']]}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE[l['s']]}?output_format=mp3_44100_64", data=body, headers={'Content-Type': 'application/json', 'Accept': 'audio/mpeg', 'xi-api-key': 'placeholder'})
    with urllib.request.urlopen(req, timeout=120) as r: open(raw, 'wb').write(r.read())
    used += len(text)
    print('erzeugt', l['id'], len(text))
  fx = FX[l['s']]
  if l['id'] in ('c5_final_c', 'c5_final_d', 'c5_final_e'): fx = 'highpass=f=160,lowpass=f=6500,volume=1.2'
  subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', fx, '-ac', '1', '-b:a', '56k', os.path.join(OUT, l['id'] + '.mp3')], check=True)
print('Zeichen verbraucht:', used)
