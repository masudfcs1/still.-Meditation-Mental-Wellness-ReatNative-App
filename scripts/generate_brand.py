"""Render the Still leaf mark at native icon resolutions."""
from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[1] / 'assets'
def cubic(p0, p1, p2, p3, steps=60):
    return [((1-t)**3*p0[0]+3*(1-t)**2*t*p1[0]+3*(1-t)*t*t*p2[0]+t**3*p3[0],
             (1-t)**3*p0[1]+3*(1-t)**2*t*p1[1]+3*(1-t)*t*t*p2[1]+t**3*p3[1])
            for t in [i/steps for i in range(steps+1)]]

def mark(size, transparent=False, mono=False):
    im=Image.new('RGBA',(size,size),(0,0,0,0) if transparent else '#F4F6EE')
    draw=ImageDraw.Draw(im)
    scale=size*.021
    offset=size*.08
    curves=[
        ([(20,34),(6,34),(3,24),(5,17)],[(5,17),(14,16),(21,22),(20,34)], '#809B7B'),
        ([(20,34),(34,34),(37,24),(35,17)],[(35,17),(26,16),(19,22),(20,34)], '#698961'),
        ([(20,29),(10,20),(13,10),(20,5)],[(20,5),(27,10),(30,20),(20,29)], '#4E7257'),
    ]
    for first,second,color in curves:
        points=cubic(*first)+cubic(*second)
        draw.polygon([(x*scale+offset,y*scale+offset) for x,y in points], fill='#4E7257' if mono else color)
    return im

mark(1024).save(out/'icon.png')
mark(1024,True).save(out/'android-icon-foreground.png')
Image.new('RGB',(1024,1024),'#F4F6EE').save(out/'android-icon-background.png')
mark(1024,True,True).save(out/'android-icon-monochrome.png')
mark(256).resize((64,64),Image.Resampling.LANCZOS).save(out/'favicon.png')
notification = Image.new('RGBA', (96, 96), (255, 255, 255, 0))
notification.putalpha(mark(384, True, True).getchannel('A').resize((96, 96), Image.Resampling.LANCZOS))
notification.save(out/'notification-icon.png')
print('Still app icons rendered.')
