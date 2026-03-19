#!/bin/bash
# =============================================================================
# launch_ec2.sh — Idempotent EC2 instance launcher
# Safe to run multiple times: checks for existing resources before creating.
# =============================================================================

set -e

KEY_NAME="vockey"
SG_NAME="launch-wizard-1"
INSTANCE_NAME="Terminal-EC2"
INSTANCE_TYPE="t3.micro"

# ─── Key Pair ─────────────────────────────────────────────────────────────────

if aws ec2 describe-key-pairs --key-names "$KEY_NAME" \
    --query "KeyPairs[0].KeyName" --output text 2>/dev/null | grep -q "^${KEY_NAME}$"; then
    echo "✅ Key pair '$KEY_NAME' already exists. Skipping creation."
else
    echo "🔑 Creating key pair '$KEY_NAME'..."
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --query "KeyMaterial" \
        --output text > "${KEY_NAME}.pem"
    chmod 400 "${KEY_NAME}.pem"
    echo "   Saved to ${KEY_NAME}.pem"
fi

# ─── VPC ──────────────────────────────────────────────────────────────────────

echo "🌐 Getting default VPC..."
VPC_ID=$(aws ec2 describe-vpcs \
    --filters Name=isDefault,Values=true \
    --query "Vpcs[0].VpcId" \
    --output text)
echo "   VPC: $VPC_ID"

# ─── Security Group ───────────────────────────────────────────────────────────

SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
    --query "SecurityGroups[0].GroupId" \
    --output text 2>/dev/null || echo "None")

if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
    echo "🔒 Creating security group '$SG_NAME'..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name "$SG_NAME" \
        --description "Allow SSH and HTTP/HTTPS" \
        --vpc-id "$VPC_ID" \
        --query "GroupId" \
        --output text)

    # Allow SSH
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0
    # Allow HTTP
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
    # Allow app port
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" --protocol tcp --port 5001 --cidr 0.0.0.0/0

    echo "   Security group created: $SG_ID"
else
    echo "✅ Security group '$SG_NAME' ($SG_ID) already exists. Skipping."
fi

# ─── Check if named instance already running ───────────────────────────────────

EXISTING_INSTANCE=$(aws ec2 describe-instances \
    --filters \
        "Name=tag:Name,Values=${INSTANCE_NAME}" \
        "Name=instance-state-name,Values=running,stopped,pending" \
    --query "Reservations[0].Instances[0].InstanceId" \
    --output text 2>/dev/null || echo "None")

if [ "$EXISTING_INSTANCE" != "None" ] && [ -n "$EXISTING_INSTANCE" ]; then
    echo "✅ Instance '$INSTANCE_NAME' ($EXISTING_INSTANCE) already exists."

    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$EXISTING_INSTANCE" \
        --query "Reservations[0].Instances[0].PublicIpAddress" \
        --output text)

    echo ""
    echo "INSTANCE READY"
    echo "Instance ID: $EXISTING_INSTANCE"
    echo "Public IP:   $PUBLIC_IP"
    echo "SSH using:   ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
    exit 0
fi

# ─── Launch New Instance ───────────────────────────────────────────────────────

echo "🔍 Fetching latest Amazon Linux 2023 AMI..."
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-*-x86_64" \
    --query "Images | sort_by(@, &CreationDate)[-1].ImageId" \
    --output text)
echo "   AMI: $AMI_ID"

echo "🚀 Launching EC2 instance '$INSTANCE_NAME'..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --associate-public-ip-address \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}}]" \
    --query "Instances[0].InstanceId" \
    --output text)

echo "   Instance ID: $INSTANCE_ID"
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"

PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query "Reservations[0].Instances[0].PublicIpAddress" \
    --output text)

echo ""
echo "✅ INSTANCE READY"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP:   $PUBLIC_IP"
echo "SSH using:   ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
