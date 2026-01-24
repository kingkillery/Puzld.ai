# File Transfer Reference

## Preferred: Native SCP

With SSH key auth configured, use native `scp` commands:

```bash
# Upload
scp local.txt k@100.76.176.119:/Users/jimpizouw/remote.txt

# Download
scp k@100.76.176.119:/Users/jimpizouw/remote.txt local.txt

# Directory (recursive)
scp -r ./mydir k@100.76.176.119:/Users/jimpizouw/
```

## Fallback: Paramiko SFTP

For programmatic file transfer when native SSH isn't available:

```python
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

# Use key auth (preferred)
client.connect('100.76.176.119', username='k', key_filename='~/.ssh/id_ed25519')

# Or password (fallback)
# client.connect('100.76.176.119', username='k', password='jhit11')

sftp = client.open_sftp()
sftp.put('local.txt', '/Users/jimpizouw/remote.txt')  # Upload
sftp.get('/Users/jimpizouw/remote.txt', 'local.txt')  # Download
sftp.close()
client.close()
```

## Transfer Directory Convention

Use `~/transfer/` on both machines for file exchange:

| Machine | Transfer Dir |
|---------|-------------|
| Windows | `C:\Users\prest\transfer\` |
| Mac | `/Users/jimpizouw/transfer/` |

```bash
# Create on both machines
mkdir ~/transfer                                    # Windows
ssh k@100.76.176.119 "mkdir -p ~/transfer"         # Mac

# Exchange files
scp file.txt k@100.76.176.119:/Users/jimpizouw/transfer/
scp k@100.76.176.119:/Users/jimpizouw/transfer/result.txt ~/transfer/
```
