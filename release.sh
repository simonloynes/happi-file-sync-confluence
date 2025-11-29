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

# RC Promotion function
promote_rc() {
    local RC_TAG=$1
    if [ -z "$RC_TAG" ]; then
        log_error "Usage: ./release.sh --promote-rc <rc-version>\nExample: ./release.sh --promote-rc v1.0.4-rc.1"
    fi
    
    # Validate RC tag format
    if [[ ! $RC_TAG =~ ^v[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+$ ]]; then
        log_error "RC version must follow format: v1.2.3-rc.1"
    fi
    
    # Extract final version from RC
    local FINAL_VERSION=$(echo $RC_TAG | sed 's/-rc\.[0-9]*$//')
    
    log_info "Promoting RC $RC_TAG to final release $FINAL_VERSION"
    
    # Check if final version already exists
    if git tag --list | grep -q "^$FINAL_VERSION$"; then
        log_error "Final version $FINAL_VERSION already exists"
    fi
    
    # Fetch all tags and branches
    log_info "Fetching latest from remote..."
    git fetch origin --tags
    
    # Check if RC tag exists
    if ! git tag --list | grep -q "^$RC_TAG$"; then
        log_error "RC tag $RC_TAG not found. Available RC tags:"
        git tag --list | grep -E 'v[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+' || echo "No RC tags found"
        exit 1
    fi
    
    # Create a new branch from the RC tag for the final release
    local RC_BRANCH="release/$RC_TAG"
    local RELEASE_BRANCH="release-promotion-$FINAL_VERSION"
    
    log_info "Creating release branch from RC tag..."
    git checkout $RC_TAG
    git checkout -b $RELEASE_BRANCH
    
    # Update package.json to final version (remove RC suffix)
    local PACKAGE_VERSION=${FINAL_VERSION#v}
    log_info "Updating package.json to final version $PACKAGE_VERSION..."
    
    # Use npm version for reliable version updates (works even with pnpm)
    if command -v npm &> /dev/null; then
        npm version $PACKAGE_VERSION --no-git-tag-version
    else
        log_error "npm is required for version updates"
    fi
    
    # Commit the version change
    git add package.json
    git commit -m "Promote RC $RC_TAG to release $FINAL_VERSION

- Update package.json version to stable release
- Promoted from tested release candidate"
    
    # Switch to main to continue with normal release process
    git checkout main
    
    # Check if main has diverged from the RC tag
    COMMITS_AHEAD=$(git rev-list --count $RC_TAG..main 2>/dev/null || echo "0")
    if [ "$COMMITS_AHEAD" -gt 0 ]; then
        log_warning "Main branch has $COMMITS_AHEAD commit(s) after the RC tag $RC_TAG"
        log_warning "This may cause merge conflicts. The following commits are on main but not in the RC:"
        git log --oneline $RC_TAG..main | sed 's/^/  - /'
        log_warning "Proceeding with merge - conflicts may need manual resolution..."
    fi
    
    git merge $RELEASE_BRANCH --no-ff -m "Merge promoted release $FINAL_VERSION from RC $RC_TAG"
    
    # Clean up temporary branch
    git branch -d $RELEASE_BRANCH
    
    # Continue with the normal release process using the final version
    log_info "Continuing with normal release process for $FINAL_VERSION..."
    
    # Set VERSION for the rest of the script to use
    VERSION=$FINAL_VERSION
}

# Handle command line arguments
if [ "$1" = "--promote-rc" ]; then
    promote_rc $2
    # VERSION is set by promote_rc function, continue with normal release flow
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage:"
    echo "  ./release.sh <version>              # Create new release"
    echo "  ./release.sh --promote-rc <rc-tag>  # Promote RC to stable release"
    echo ""
    echo "Examples:"
    echo "  ./release.sh v1.0.4"
    echo "  ./release.sh --promote-rc v1.0.4-rc.1"
    exit 0
else
    # Check if version argument is provided
    VERSION=$1
    if [ -z "$VERSION" ]; then
        log_error "Usage: ./release.sh <version>\nExample: ./release.sh v1.0.4\n\nFor RC promotion: ./release.sh --promote-rc v1.0.4-rc.1"
    fi
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
# Use npm version for reliable version updates (works even with pnpm)
if command -v npm &> /dev/null; then
    npm version ${VERSION#v} --no-git-tag-version
else
    log_error "npm is required for version updates"
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