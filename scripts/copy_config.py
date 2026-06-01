import shutil

src = 'scripts/categories_generated.js'
dst = 'dashboard/src/components/BubbleChartPanel/categories.config.js'

shutil.copy2(src, dst)
print(f"Successfully copied {src} to {dst}")
