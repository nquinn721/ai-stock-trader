#!/bin/bash

# Database Deletion Investigation Script
# This script helps identify why your database keeps getting deleted

set -e

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
INSTANCE_NAME="${DATABASE_INSTANCE_NAME:-ai-stock-trader-db}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if gcloud is configured
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_error "Not authenticated with gcloud. Run 'gcloud auth login'"
    exit 1
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    print_error "No project configured. Run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

print_header "DATABASE DELETION INVESTIGATION"
echo "Project: $CURRENT_PROJECT"
echo "Target Instance: $INSTANCE_NAME"
echo "Investigation Time: $(date)"
echo ""

# 1. Check current database status
print_header "1. CURRENT DATABASE STATUS"
if gcloud sql instances describe $INSTANCE_NAME --quiet >/dev/null 2>&1; then
    print_success "Database instance '$INSTANCE_NAME' currently EXISTS"
    
    # Get instance details
    echo ""
    echo "Instance Details:"
    gcloud sql instances describe $INSTANCE_NAME --format="table(
        name,
        state,
        databaseVersion,
        settings.tier,
        region,
        settings.deletionProtectionEnabled,
        createTime
    )"
    
    # Check deletion protection
    DELETION_PROTECTION=$(gcloud sql instances describe $INSTANCE_NAME --format="value(settings.deletionProtectionEnabled)")
    if [ "$DELETION_PROTECTION" = "True" ]; then
        print_success "✅ Deletion protection is ENABLED"
    else
        print_error "❌ Deletion protection is DISABLED - This is likely why it keeps getting deleted!"
        echo "   Fix with: gcloud sql instances patch $INSTANCE_NAME --deletion-protection"
    fi
    
else
    print_error "❌ Database instance '$INSTANCE_NAME' does NOT exist"
    echo "   This confirms the database has been deleted again."
fi

echo ""

# 2. Check deletion events in the last 7 days
print_header "2. RECENT DELETION EVENTS"
print_status "Searching for database deletion events in the last 7 days..."

DELETION_EVENTS=$(gcloud logging read "protoPayload.methodName=sql.instances.delete AND resource.labels.database_id:$INSTANCE_NAME" \
    --limit=10 \
    --since="7d" \
    --format="csv(timestamp,protoPayload.authenticationInfo.principalEmail,protoPayload.resourceName,protoPayload.request.body)" \
    2>/dev/null | tail -n +2)

if [ -z "$DELETION_EVENTS" ]; then
    print_warning "No deletion events found in audit logs for the last 7 days"
    echo "   This could mean:"
    echo "   - The deletion happened more than 7 days ago"
    echo "   - Audit logging is not enabled"
    echo "   - The instance was deleted by a different method"
else
    print_error "🚨 FOUND DELETION EVENTS:"
    echo "$DELETION_EVENTS" | while IFS=',' read -r timestamp email resource body; do
        echo "   Time: $timestamp"
        echo "   User: $email"
        echo "   Resource: $resource"
        echo "   ----------------------------------------"
    done
fi

echo ""

# 3. Check all database operations in the last 3 days
print_header "3. RECENT DATABASE OPERATIONS"
print_status "Checking all database operations in the last 3 days..."

gcloud logging read "resource.type=cloudsql_database AND protoPayload.methodName:sql.instances" \
    --limit=20 \
    --since="3d" \
    --format="table(timestamp,protoPayload.authenticationInfo.principalEmail,protoPayload.methodName,resource.labels.database_id)" \
    2>/dev/null || print_warning "No database operations found or audit logging not available"

echo ""

# 4. Check Cloud Build history
print_header "4. CLOUD BUILD INVESTIGATION"
print_status "Checking recent Cloud Build jobs that might affect database..."

# Check builds in the last 3 days
RECENT_BUILDS=$(gcloud builds list --limit=10 --since="3d" --format="value(id,status,createTime)" 2>/dev/null)

if [ -z "$RECENT_BUILDS" ]; then
    print_warning "No recent Cloud Build jobs found"
else
    echo "Recent Cloud Build jobs:"
    echo "$RECENT_BUILDS" | while IFS=$'\t' read -r id status time; do
        echo "   Build: $id | Status: $status | Time: $time"
        
        # Check if this build had database operations
        DB_LOGS=$(gcloud logging read "resource.type=build AND resource.labels.build_id=$id AND (textPayload:sql OR textPayload:database OR textPayload:delete)" \
            --limit=5 \
            --format="value(textPayload)" 2>/dev/null)
        
        if [ -n "$DB_LOGS" ]; then
            print_error "   ⚠️  This build had database-related operations:"
            echo "$DB_LOGS" | sed 's/^/      /'
        fi
    done
fi

echo ""

# 5. Check IAM permissions
print_header "5. IAM PERMISSIONS AUDIT"
print_status "Checking who has dangerous database permissions..."

# Check for overly broad permissions
echo "Users/Service Accounts with cloudsql.admin role:"
gcloud projects get-iam-policy $CURRENT_PROJECT \
    --flatten="bindings[].members" \
    --filter="bindings.role=roles/cloudsql.admin" \
    --format="value(bindings.members)" 2>/dev/null | while read -r member; do
    if [ -n "$member" ]; then
        echo "   - $member"
        if [[ $member == *"@developer.gserviceaccount.com" ]]; then
            print_warning "     ⚠️  Default Compute Engine service account has admin access!"
        fi
    fi
done

echo ""
echo "Users/Service Accounts with Editor role (can delete databases):"
gcloud projects get-iam-policy $CURRENT_PROJECT \
    --flatten="bindings[].members" \
    --filter="bindings.role=roles/editor" \
    --format="value(bindings.members)" 2>/dev/null | while read -r member; do
    if [ -n "$member" ]; then
        echo "   - $member"
    fi
done

echo ""
echo "Users/Service Accounts with Owner role (can delete databases):"
gcloud projects get-iam-policy $CURRENT_PROJECT \
    --flatten="bindings[].members" \
    --filter="bindings.role=roles/owner" \
    --format="value(bindings.members)" 2>/dev/null | while read -r member; do
    if [ -n "$member" ]; then
        echo "   - $member"
    fi
done

echo ""

# 6. Check for automation that might delete databases
print_header "6. AUTOMATION AND SCRIPTS CHECK"
print_status "Checking for potential automation that could delete databases..."

# Check for scheduled jobs or functions
echo "Cloud Functions that might affect databases:"
gcloud functions list --format="table(name,status,trigger)" 2>/dev/null | grep -E "(sql|database|cleanup|delete)" || echo "   No suspicious Cloud Functions found"

echo ""
echo "Cloud Scheduler jobs:"
gcloud scheduler jobs list --format="table(name,schedule,state)" 2>/dev/null | grep -E "(sql|database|cleanup|delete)" || echo "   No suspicious Cloud Scheduler jobs found"

echo ""

# 7. Generate recommendations
print_header "7. RECOMMENDATIONS"

echo "Based on the investigation, here are immediate actions to take:"
echo ""

# Check if deletion protection is disabled
if gcloud sql instances describe $INSTANCE_NAME --quiet >/dev/null 2>&1; then
    DELETION_PROTECTION=$(gcloud sql instances describe $INSTANCE_NAME --format="value(settings.deletionProtectionEnabled)" 2>/dev/null)
    if [ "$DELETION_PROTECTION" != "True" ]; then
        print_error "🚨 CRITICAL: Enable deletion protection immediately:"
        echo "   gcloud sql instances patch $INSTANCE_NAME --deletion-protection"
        echo ""
    fi
else
    print_error "🚨 CRITICAL: Database doesn't exist - recreate with protection:"
    echo "   bash scripts/setup-database.sh"
    echo ""
fi

echo "🔒 SECURITY RECOMMENDATIONS:"
echo "   1. Review IAM permissions and remove unnecessary cloudsql.admin roles"
echo "   2. Use least-privilege service accounts"
echo "   3. Enable audit logging if not already enabled"
echo "   4. Set up monitoring alerts for database operations"
echo ""

echo "📋 MONITORING RECOMMENDATIONS:"
echo "   1. Set up alerts for database deletion attempts"
echo "   2. Monitor Cloud Build jobs for database operations"
echo "   3. Regular backup verification"
echo "   4. Implement database change approval process"
echo ""

echo "🛡️ PROTECTION RECOMMENDATIONS:"
echo "   1. Always enable deletion protection on production databases"
echo "   2. Use separate databases for development and production"
echo "   3. Implement infrastructure as code (Terraform) with state protection"
echo "   4. Create automated backup and recovery procedures"
echo ""

print_header "INVESTIGATION COMPLETE"
echo "Review the findings above and take immediate action on critical items."
echo "Save this output for future reference and incident documentation."
