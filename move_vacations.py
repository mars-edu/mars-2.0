import re

with open("src/pages/EducationSchedule.vue", "r") as f:
    content = f.read()

# Find vacations accordion
vacations_match = re.search(r'\s*<AccordionItem id="vacations".*?<\/AccordionItem>', content, re.DOTALL)
if vacations_match:
    vacations_block = vacations_match.group(0)
    
    # Remove it from its original place
    content = content.replace(vacations_block, "")
    
    # Find scheduled-intermediate-controls accordion
    intermediate_match = re.search(r'(<AccordionItem\s+id="scheduled-intermediate-controls".*?<\/AccordionItem>)', content, re.DOTALL)
    if intermediate_match:
        intermediate_block = intermediate_match.group(1)
        
        # Insert vacations block right after intermediate controls
        content = content.replace(intermediate_block, intermediate_block + vacations_block)
        
        with open("src/pages/EducationSchedule.vue", "w") as f:
            f.write(content)
        print("Successfully moved vacations section!")
    else:
        print("Error: Could not find scheduled-intermediate-controls section.")
else:
    print("Error: Could not find vacations section.")
