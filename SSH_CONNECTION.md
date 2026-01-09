# 🔐 SSH Connection Guide

## Server Details
- **IP Address:** 77.42.74.242
- **Domain:** kiminvestment.space

## SSH Connection

Since SSH requires an interactive password, you'll need to connect manually from your terminal.

### Option 1: If Username is "Rentflow@2025" (with special characters)

```bash
# Escape the @ symbol or use quotes
ssh "Rentflow@2025@77.42.74.242"

# Or escape it
ssh 'Rentflow@2025'@77.42.74.242

# Or if the username might be different, try:
ssh Rentflow2025@77.42.74.242
```

### Option 2: Common Username Formats

Try these common username formats:

```bash
# If it's a regular username without @
ssh rentflow2025@77.42.74.242

# Or if it's the root user
ssh root@77.42.74.242

# Or if it's a different format
ssh admin@77.42.74.242
```

### Option 3: Using SSH with Password File (if you have sshpass installed)

```bash
# Install sshpass (if not installed)
brew install hudochenkov/sshpass/sshpass  # macOS
# or
sudo apt install sshpass  # Linux

# Then connect
sshpass -p 'YOUR_PASSWORD' ssh Rentflow2025@77.42.74.242
```

## Manual Connection Steps

1. **Open Terminal/Command Prompt**

2. **Type the SSH command:**
   ```bash
   ssh root@77.42.74.242
   # or
   ssh Rentflow2025@77.42.74.242
   ```

3. **Enter password when prompted**
   - The password will not show as you type (for security)
   - Press Enter after typing the password

4. **Verify connection:**
   - You should see a command prompt like: `root@server:~#` or similar

## After Connecting

Once you're connected to the VPS, run these commands to deploy:

### Quick Setup (Automated)
```bash
cd /tmp
wget https://raw.githubusercontent.com/Anoncodex01/rentflow/main/server-setup.sh
chmod +x server-setup.sh
bash server-setup.sh
```

### Manual Setup (If needed)
See `VPS_DEPLOYMENT.md` for detailed manual setup instructions.

## Troubleshooting

### "Permission denied"
- Check username is correct
- Verify password is correct
- Try different username variations

### "Connection refused"
- Check server IP is correct: 77.42.74.242
- Verify server is running
- Check firewall allows SSH (port 22)

### "Host key verification failed"
```bash
ssh-keygen -R 77.42.74.242
```
Then try connecting again.

## Next Steps After Connection

1. ✅ Run the automated setup script
2. ✅ Setup SSL certificate
3. ✅ Verify DNS points to server
4. ✅ Test the website

---

**Note:** I cannot automatically SSH into your server because it requires an interactive password prompt. You'll need to connect manually from your terminal.
