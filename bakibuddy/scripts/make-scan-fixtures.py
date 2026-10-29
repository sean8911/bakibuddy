"""Generate fictional printed images for actual OCR tests; no personal source data."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1] / 'tests' / 'fixtures'
regular = 'C:/Windows/Fonts/arial.ttf'
bold = 'C:/Windows/Fonts/arialbd.ttf'
def font(size=26, weight=False): return ImageFont.truetype(bold if weight else regular, size)

receipt = Image.new('RGB', (700, 900), 'white')
draw = ImageDraw.Draw(receipt)
for text, y, size, weight in [
    ('SYNTHETIC RECEIPT', 30, 25, False),
    ('Campus Moon Cafe', 90, 36, True),
    ('26/10/2026  13:20', 160, 27, False),
    ('Meal                           RM8.20', 240, 27, False),
    ('Drink                          RM4.14', 290, 27, False),
    ('SUBTOTAL                  RM12.34', 390, 27, False),
    ('TOTAL                       RM12.34', 460, 32, True),
    ('CASH TENDERED         RM20.00', 560, 25, False),
    ('CHANGE                       RM7.66', 610, 25, False),
    ('Thank you', 730, 26, False),
]: draw.text((35, y), text, font=font(size, weight), fill='black')
receipt.save(root / 'scan-fictional-receipt.png')
copy = receipt.copy()
copy.putpixel((0, 0), (254,254,254))
copy.save(root / 'scan-fictional-overlap.png')

activity = Image.new('RGB', (900, 1500), 'white')
draw = ImageDraw.Draw(activity)
draw.text((35, 30), 'Activity', font=font(42,True), fill='black')
draw.text((35, 100), 'Transaction', font=font(30,True), fill='black')
draw.text((35, 170), '01 Oct 26 - 27 Oct 26', font=font(28), fill='black')
rows = [
    ('26 Oct, 12:30', 'Moon Canteen', '-RM8.20', 'DuitNow QR TNGD'),
    ('25 Oct, 10:40', 'Transfer to Study Partner', '-RM4.00', 'Transfer to Wallet'),
    ('24 Oct, 09:20', 'Reload from Bank', '+RM50.00', 'Reload'),
    ('23 Oct, 15:10', 'Moon Canteen refund', '+RM2.00', 'Refund'),
]
for i, (date, name, amount, kind) in enumerate(rows):
    y = 290 + i * 270
    draw.text((35, y), date, font=font(27), fill='#555555')
    draw.text((35, y+55), name, font=font(30), fill='black')
    draw.text((700, y+55), amount, font=font(30), fill='black')
    draw.text((35, y+112), kind, font=font(25), fill='#555555')
    if i == 0: draw.text((735, y+115), '+8 points', font=font(22), fill='blue')
    draw.line((35, y+200, 860, y+200), fill='#bbbbbb', width=2)
activity.save(root / 'scan-fictional-activity.png')
Image.new('RGB', (500,500), 'white').save(root / 'scan-blank.png')
print('Generated four fictional OCR test images.')
