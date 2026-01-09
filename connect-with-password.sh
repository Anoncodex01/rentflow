#!/bin/bash
# SSH Connection Script with Password
# This uses expect to automate password entry
# Usage: ./connect-with-password.sh

IP="77.42.74.242"
USERNAME="root"  # Change this to your actual username

# Check if expect is installed
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install expect
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install expect -y
    fi
fi

echo "Enter your SSH password:"
read -s PASSWORD

echo "Connecting to $IP as $USERNAME..."

expect << EOF
spawn ssh $USERNAME@$IP
expect {
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "$PASSWORD\r"
    }
}
expect {
    "password:" {
        puts "\nIncorrect password or authentication failed"
        exit 1
    }
    "\$" {
        puts "\nConnected successfully!"
        interact
    }
    "#" {
        puts "\nConnected successfully!"
        interact
    }
}
EOF
