#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if version argument is provided
VERSION=$1
if [ -z "$VERSION" ]; then
    log_error "Usage: ./release.sh <version>\nExample: ./release.sh v1.0.4"
fi

# Validate version format (must start with 'v' and follow semver)
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Version must follow semantic versioning format: v1.2.3"
fi

# Extract major version for branch management
MAJOR_VERSION=$(echo $VERSION | cut -d. -f1)

log_info "Starting release process for $VERSION"
log_info "Major version branch: $MAJOR_VERSION"

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_error "Must be on main branch to release. Current branch: $CURRENT_BRANCH"
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    log_error "Working directory is not clean. Please commit or stash changes."
fi

# Check if tag already exists
if git tag --list | grep -q "^$VERSION$"; then
    log_error "Tag $VERSION already exists"
fi

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    log_warning "GitHub CLI (gh) not found. Release will be created without GitHub integration."
    USE_GH=false
else
    USE_GH=true
fi

# Pull latest changes
log_info "Pulling latest changes from origin/main..."
git pull origin main

# Check if we have pnpm or npm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    log_error "Neither pnpm nor npm found"
fi

# Install dependencies
log_info "Installing dependencies with $PKG_MANAGER..."
$PKG_MANAGER install

# Run tests
log_info "Running tests..."
$PKG_MANAGER test

# Build the action
log_info "Building the action..."
$PKG_MANAGER run build

# Check if dist directory exists and has content
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    log_error "Build failed - dist directory is missing or empty"
fi

# Update package.json version (without creating git tag)
log_info "Updating package.json to version ${VERSION#v}..."
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm version ${VERSION#v} --no-git-tag-version
else
    npm version ${VERSION#v} --no-git-tag-version
fi

# Stage and commit all changes
log_info "Committing changes..."
git add -A
git commit -m "Release $VERSION

- Update package.json version
- Build action for release"

# Create and push tag
log_info "Creating and pushing tag $VERSION..."
git tag $VERSION
git push origin main
git push origin $VERSION

# Update major version branch
log_info "Updating major version branch $MAJOR_VERSION..."

# Check if major version branch exists locally
if git show-ref --verify --quiet refs/heads/$MAJOR_VERSION; then
    log_info "Switching to existing local branch $MAJOR_VERSION..."
    git checkout $MAJOR_VERSION
else
    # Check if it exists remotely
    if git ls-remote --exit-code --heads origin $MAJOR_VERSION >/dev/null 2>&1; then
        log_info "Checking out remote branch $MAJOR_VERSION..."
        git checkout -b $MAJOR_VERSION origin/$MAJOR_VERSION
    else
        log_info "Creating new branch $MAJOR_VERSION..."
        git checkout -b $MAJOR_VERSION
    fi
fi

# Merge main into major version branch
git merge main --no-ff -m "Update $MAJOR_VERSION to $VERSION"

# Push major version branch
git push origin $MAJOR_VERSION

# Return to main branch
git checkout main

# Create GitHub release if GitHub CLI is available
if [ "$USE_GH" = true ]; then
    log_info "Creating GitHub release..."
    if gh release create $VERSION --generate-notes --latest; then
        log_success "GitHub release created successfully!"
    else
        log_warning "Failed to create GitHub release, but tags were pushed successfully"
    fi
else
    log_info "GitHub CLI not available - you can create the release manually at:"
    log_info "https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')/releases/new?tag=$VERSION"
fi

log_success "Release $VERSION completed successfully!"
log_info "Users can now reference your action with:"
log_info "  - uses: $(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')@$VERSION"
log_info "  - uses: $(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')@$MAJOR_VERSION"

log_info "Next steps:"
log_info "1. Verify the release at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')/releases"
log_info "2. Update any documentation that references the version"
log_info "3. Test the action using the new tag"