import os
import glob
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix broken tailwind opacity
    content = re.sub(r'bg-white/40/(\d+)', r'bg-white/\1', content)
    content = re.sub(r'bg-secondary/(\d+)', r'bg-white/\1', content)
    content = re.sub(r'bg-white/60 backdrop-blur-xl/(\d+)', r'bg-white/\1 backdrop-blur-xl', content)
    
    # Make sure text-navy is text-slate-800 or similar
    content = content.replace('text-navy', 'text-slate-800')
    content = content.replace('text-muted-foreground', 'text-slate-500')
    
    # Fix border colors
    content = content.replace('border-border', 'border-white/50')
    
    # Check for empty bg-white/40
    content = content.replace('bg-white/40 ', 'bg-white/40 ')
    
    with open(filepath, 'w') as f:
        f.write(content)

files = glob.glob('/Users/shaikhjubair/Documents/uiujef-home-page/components/admin/*.tsx') + ['/Users/shaikhjubair/Documents/uiujef-home-page/app/blackberry/dashboard/page.tsx']
for file in files:
    fix_file(file)
print("Syntax fixed.")
