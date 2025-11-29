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

# Helper function to update package.json version if needed
update_package_version() {
    local TARGET_VERSION=$1
    local CURRENT_VERSION
    
    # Read current version from package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
    fi
    
    # Read version using grep (works regardless of module type)
    CURRENT_VERSION=$(grep -oE '"version"\s*:\s*"[^"]*"' package.json | sed -E 's/.*"version"\s*:\s*"([^"]*)".*/\1/')
    
    if [ -z "$CURRENT_VERSION" ]; then
        log_error "Could not read current version from package.json"
    fi
    
    if [ "$CURRENT_VERSION" = "$TARGET_VERSION" ]; then
        log_info "Package version is already $TARGET_VERSION, skipping update"
        return 0
    fi
    
    log_info "Updating package.json from $CURRENT_VERSION to $TARGET_VERSION..."
    
    # Use npm version for reliable version updates (works even with pnpm)
    if command -v npm &> /dev/null; then
        npm version $TARGET_VERSION --no-git-tag-version
    else
        log_error "npm is required for version updates"
    fi
}

# Check arguments
VERSION=$1
RC_NUM=${2:-1}

if [ -z "$VERSION" ]; then
    log_error "Usage: ./create-rc.sh <version> [rc-number]
Examples:
  ./create-rc.sh v1.0.4        # Creates v1.0.4-rc.1
  ./create-rc.sh v1.0.4 2      # Creates v1.0.4-rc.2"
fi

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Version must follow semantic versioning format: v1.2.3"
fi

# Validate RC number is numeric
if [[ ! $RC_NUM =~ ^[0-9]+$ ]]; then
    log_error "RC number must be numeric"
fi

RC_VERSION="$VERSION-rc.$RC_NUM"
RC_BRANCH="release/$RC_VERSION"

log_info "Creating Release Candidate: $RC_VERSION"
log_info "Branch: $RC_BRANCH"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository"
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    log_error "Working directory is not clean. Please commit or stash changes."
fi

# Check if RC branch already exists
if git show-ref --verify --quiet refs/heads/$RC_BRANCH; then
    log_error "RC branch '$RC_BRANCH' already exists locally"
fi

if git ls-remote --exit-code --heads origin $RC_BRANCH >/dev/null 2>&1; then
    log_error "RC branch '$RC_BRANCH' already exists on remote"
fi

# Check if RC tag already exists
if git tag --list | grep -q "^$RC_VERSION$"; then
    log_error "RC tag '$RC_VERSION' already exists"
fi

# Ensure we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "Not on main branch. Switching to main..."
    git checkout main
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

# Create RC branch from main
log_info "Creating RC branch from main..."
git checkout -b $RC_BRANCH

# Update package.json version to RC version
PACKAGE_VERSION=${RC_VERSION#v}
update_package_version $PACKAGE_VERSION

# Commit the version change
git add package.json
git commit -m "Prepare Release Candidate $RC_VERSION

- Update package.json version for RC
- Ready for automated build and testing"

# Push RC branch to remote
log_info "Pushing RC branch to remote..."
git push origin $RC_BRANCH

log_success "Release Candidate $RC_VERSION created successfully!"

log_info "Next steps:"
log_info "1. 🔄 GitHub Actions will automatically build and tag this RC"
log_info "2. 🧪 Automated tests will run on the prerelease"
log_info "3. 📋 Check the Actions tab: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')/actions"
log_info "4. 🎯 Once built, test manually with: uses: $(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')@$RC_VERSION"
log_info "5. ✅ If tests pass, promote with: ./release.sh --promote-rc $RC_VERSION"

log_warning "Returning to main branch..."
git checkout main

log_success "Ready for RC testing! 🚀"