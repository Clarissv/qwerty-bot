# 📋 Staff Guide - Discord Bot Store Management

## Overview
This guide explains how to use the Discord bot as a staff member to manage the server slot store, process purchases, and activate boosts.

---

## 🔧 Initial Setup (Admin Only)

### Step 1: Configure Bot Settings
Use `/configure` to set up all required channels and roles:

```
/configure chatroom-category <category>
```
- Sets the category where server chatrooms will be created

```
/configure ticket-category <category>
```
- Sets the category where ticket channels will be created

```
/configure staff-role <role>
```
- Sets the role that can manage tickets and servers

```
/configure approval-channel <channel>
```
- Sets the channel where purchase approvals will be sent

```
/configure audit-log <channel>
```
- Sets the channel for logging all bot actions

```
/configure qris <url>
```
- Sets the payment QR code image URL

---

## 🖥️ Opening a New Server

### Command: `/open`
Opens a new server slot for sale.

**Parameters:**
- `duration`: Boost duration in hours (1-72)
- `price`: Price per slot in IDR (minimum 1000)

**Example:**
```
/open duration:6 price:20000
```

**What happens:**
1. ✅ New server created in database
2. 🎭 Role created: `Server X Member`
3. 💬 Channel created: `server-X-chat`
4. 📢 All panels automatically update
5. 📝 Action logged to audit channel

**Result:**
- Server appears in all panels (Member Panel, Admin Panel)
- Members can now purchase slots for this server
- Server starts at 0/20 slots

---

## 📨 Sending Panels

### Member Panel
Shows all servers available for purchase.

```
/send panel:Member Panel
```

**Panel includes:**
- 🛒 **Purchase dropdown**: Select server to buy slots
- ℹ️ **Server Info dropdown**: View server details and member list

### Admin Panel (Staff Only)
Staff control panel for managing servers.

```
/send panel:Admin Panel
```

**Panel includes:**
- ⚡ **Activate Boost dropdown**: Activate boosts for any server (no slot requirement)

---

## ✅ Approving Purchases

### Process
1. Member creates purchase ticket
2. Bot sends approval request to approval channel
3. Staff reviews and approves/declines

### Approval Message
Shows:
- 👤 **User**: Who is purchasing
- 🖥️ **Server**: Which server they're buying
- 👥 **Slots**: How many slots
- 📝 **Roblox Usernames**: List of usernames
- 💰 **Total Price**: Price calculation

### Actions

**✅ Approve:**
- Click the green **Approve** button
- User gets server role
- User added to server chatroom
- Slots added to server count
- Ticket marked as approved
- User notified in ticket channel

**❌ Decline:**
- Click the red **Decline** button
- Ticket marked as declined
- User notified in ticket channel
- No role/slots added

**Important:**
- Each ticket can only be approved/declined once
- After processing, buttons are removed
- All actions are logged to audit channel

---

## ⚡ Activating Server Boosts

### When to Activate
- You can activate boost at **any time** (no slot requirement)
- Recommended: Wait until server is full (20/20) for maximum profit
- Or activate early for priority customers

### How to Activate

**Method 1: Admin Panel**
1. Use the Admin Panel dropdown
2. Select the server to activate
3. Confirm activation

**Method 2: Manual Check**
```
/servers
```
- View all active servers
- Check current slot count
- Use Admin Panel to activate

### What Happens on Activation
1. ✅ Server boost status set to "Active"
2. ⏰ Start and end times recorded
3. 📢 Announcement sent to server chatroom (pings all members)
4. 📝 Logged to audit channel
5. 🔄 All panels update automatically

### Boost Announcement (Auto-sent)
```
⚡ BOOST ACTIVATED!

Server X boost is now active!
All members can join the game server for x8 boost experience.

⏰ Duration: 6 hours
🕐 Started: [timestamp]
🕐 Ends: [timestamp]
```

---

## 📊 Monitoring & Management

### View All Servers
```
/servers
```

**Shows for each server:**
- Server ID and status
- Slot count (X/20)
- Boost status (Active/Pending)
- Duration and price
- Boost end time (if active)

### Checking Tickets
- All tickets appear in the ticket category
- Each ticket shows:
  - Server information
  - Slot count
  - Payment QR code (if configured)
- Staff can close tickets using the 🔒 **Close Ticket** button

---

## 🔄 Resetting Servers

### Command: `/reset`
Removes all active servers from the system.

**Basic Reset** (keep channels):
```
/reset confirm:True
```

**Full Reset** (delete everything):
```
/reset confirm:True delete-channels:True clear-tickets:True
```

**Parameters:**
- `confirm`: Must be `True` to proceed
- `delete-channels`: Also delete all server channels and roles
- `clear-tickets`: Also clear all tickets and purchases

**Use Cases:**
- 🔁 Start fresh with new servers
- 🧹 Clean up expired servers
- 🗑️ Remove all data after event

**Warning:** This action cannot be undone!

---

## 🎯 Best Practices

### Opening Servers
- ✅ Set competitive prices
- ✅ Choose appropriate boost duration
- ✅ Open multiple servers during peak hours
- ✅ Close old servers before opening new ones

### Processing Tickets
- ✅ Verify payment before approving
- ✅ Check Roblox usernames are valid
- ✅ Respond quickly to maintain good service
- ✅ Use decline with explanation if needed

### Activating Boosts
- ✅ Coordinate with team before activation
- ✅ Ensure in-game server is ready
- ✅ Announce in server chatroom manually if needed
- ✅ Monitor boost timer

### Communication
- ✅ Check ticket channels regularly
- ✅ Answer member questions in server chatrooms
- ✅ Use professional, friendly tone
- ✅ Log any issues in staff channel

---

## ⚠️ Common Issues & Solutions

### "Configuration Missing"
- **Problem**: Required settings not configured
- **Solution**: Run all `/configure` commands

### "Permission Denied"
- **Problem**: User doesn't have staff role
- **Solution**: Check if staff role is configured correctly

### Ticket Not Appearing
- **Problem**: Approval channel not set
- **Solution**: Use `/configure approval-channel`

### Panels Not Updating
- **Problem**: Panel registration failed
- **Solution**: Re-send the panel with `/send`

### Server Channel Not Created
- **Problem**: Bot lacks permissions
- **Solution**: Check bot has "Manage Channels" and "Manage Roles" permissions

---

## 📞 Support

If you encounter issues:
1. Check console/terminal for error messages
2. Verify all configuration settings
3. Ensure bot has proper permissions
4. Check audit log for error details
5. Review this guide for proper usage

---

## 🔐 Required Permissions

### Bot Permissions Needed:
- ✅ Manage Channels
- ✅ Manage Roles
- ✅ Send Messages
- ✅ Embed Links
- ✅ Read Message History
- ✅ Add Reactions
- ✅ Use Slash Commands

### Staff Role Permissions:
- ✅ Manage Messages (in ticket channels)
- ✅ Access to approval channel
- ✅ Access to audit log channel

---

## 📈 Workflow Summary

```
┌─────────────────────────────────────────────┐
│  1. ADMIN: Configure bot settings          │
│     /configure (all settings)               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  2. STAFF: Open server for sales           │
│     /open duration:6 price:20000            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  3. STAFF: Send panels to channels         │
│     /send panel:Member Panel                │
│     /send panel:Admin Panel                 │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  4. MEMBER: Purchases slot (automatic)     │
│     → Ticket created                        │
│     → Approval sent to staff                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  5. STAFF: Review & approve ticket         │
│     Click ✅ Approve or ❌ Decline          │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  6. STAFF: Activate boost when ready       │
│     Use Admin Panel dropdown                │
│     (Can activate at any slot count)        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  7. MEMBERS: Join boosted server           │
│     Play with x8 boost for duration         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  8. STAFF: Clean up after boost expires    │
│     /reset confirm:True delete-channels:True│
└─────────────────────────────────────────────┘
```

---

**Last Updated:** November 9, 2025
**Bot Version:** 1.0
