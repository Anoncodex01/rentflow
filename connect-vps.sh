#!/bin/bash
# SSH Connection Script for VPS
# Usage: ./connect-vps.sh

IP="77.42.74.242"
echo "Connecting to VPS server..."
echo "IP: $IP"
echo ""
echo "If prompted, enter your password"
echo ""

# Try common usernames
echo "Trying 'root' user..."
ssh root@$IP

# If root doesn't work, try other common usernames
# Uncomment and modify as needed:
# ssh ubuntu@$IP
# ssh admin@$IP
# ssh rentflow@$IP
