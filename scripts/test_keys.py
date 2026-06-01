import generate_js_config
print("ASTS in company_names:", "ASTS" in generate_js_config.company_names)
print("ASTS value:", generate_js_config.company_names.get("ASTS"))
print("AI value:", generate_js_config.company_names.get("AI"))

# Check generated output file content
with open('scripts/categories_generated.js', 'r', encoding='utf-8') as f:
    content = f.read()
print("ASTS in generated:", "'ASTS':" in content)
print("AI in generated:", "'AI':" in content)
print("BULL in generated:", "'BULL':" in content)
print("XYZ in generated:", "'XYZ':" in content)
