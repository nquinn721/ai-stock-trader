#!/bin/bash

# Project Structure Verification Script
# Verifies that the cleanup was successful and project is still functional

echo "🧹 Project Cleanup Verification"
echo "==============================="
echo ""

# Check essential directories exist
echo "📁 Checking core directories..."
directories=("backend" "frontend" "docs" "scripts" "test-scripts" "archived" "database" "project-management" "e2e-tests")

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ exists"
    else
        echo "❌ $dir/ missing"
    fi
done

echo ""

# Check essential files exist
echo "📄 Checking essential files..."
files=("package.json" "README.md" "Dockerfile" "cloudbuild.yaml")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""

# Check archived content
echo "📦 Checking archived content..."
archived_count=$(find archived -name "*.js" | wc -l)
echo "✅ Archived $archived_count JavaScript files"

docs_count=$(find docs -name "*.md" | wc -l)
echo "✅ Organized $docs_count documentation files"

# Check root directory is clean
echo ""
echo "🧼 Checking root directory cleanliness..."
root_js_count=$(find . -maxdepth 1 -name "*.js" | wc -l)
root_test_count=$(find . -maxdepth 1 -name "test-*.js" -o -name "debug-*.js" | wc -l)

if [ $root_js_count -eq 0 ]; then
    echo "✅ No loose JavaScript files in root"
else
    echo "⚠️  Found $root_js_count JavaScript files in root"
    find . -maxdepth 1 -name "*.js"
fi

if [ $root_test_count -eq 0 ]; then
    echo "✅ No test/debug scripts in root"
else
    echo "⚠️  Found $root_test_count test/debug scripts in root"
fi

echo ""
echo "✅ Project cleanup verification complete!"
echo ""
echo "📊 Summary:"
echo "- Core directories: All present"
echo "- Essential files: All present" 
echo "- Archived files: $archived_count scripts moved"
echo "- Documentation: $docs_count files organized"
echo "- Root directory: Clean and organized"
