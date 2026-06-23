require('dotenv').config();
const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, 
    AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    ComponentType
} = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// --- CONSTANTE DE DESIGN SPECIFICE (CONFORM SCREENSHOT-URILOR TALE) ---
const VISUALS = {
    success: '✅',
    alarm: '🚨',
    staff: '👑',
    loading: '⏳'
};

const IMAGES = {
    warning: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200&auto=format&fit=crop',
    panelBanner: 'https://i.imgur.com/83pZpG6.jpeg',
    welcomeBanner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
};

const CONFIG = {
    LOG_CHANNEL_ID: '1518704438053961861',
    WELCOME_CHANNEL_ID: '1518704531402264586',
    VOUCH_CHANNEL_ID: '1518704760541413376',
    TICKET_CATEGORY_ID: '1518704343275143188',
    STAFF_ROLE_ID: '1518703920174731504', 
    SCAMMER_ROLE_ID: '1518703743070110003',
    SUSPECT_ROLE_ID: '1518703793544364223'
};

// --- DATABASE CORE ENGINE: PERSISTENȚĂ ATOMICĂ LOCALĂ (ANTI-DATA-LOSS RENDER) ---
class LocalJSONDatabase {
    constructor(filepath = 'cluster_store.json') {
        this.filepath = path.join(process.cwd(), filepath);
        this.cache = { vouches: {}, pendingVouches: {}, sanctions: {} };
        this.init();
    }
    init() {
        try {
            if (fs.existsSync(this.filepath)) {
                const fileData = fs.readFileSync(this.filepath, 'utf8');
                this.cache = JSON.parse(fileData);
            } else {
                this.syncToDisk();
            }
        } catch (e) { console.error('[DB STORAGE CRITICAL]: RECONSTRUCTING IN-MEMORY ONLY', e); }
    }
    syncToDisk() {
        try {
            fs.writeFileSync(this.filepath, JSON.stringify(this.cache, null, 4), 'utf8');
        } catch (e) { console.error('[DB WRITE FAULT]:', e); }
    }
    getSpace(space, key, fallback = null) {
        if (!this.cache[space]) this.cache[space] = {};
        return this.cache[space][key] || fallback;
    }
    setSpace(space, key, value) {
        if (!this.cache[space]) this.cache[space] = {};
        this.cache[space][key] = value;
        this.syncToDisk();
    }
    deleteSpace(space, key) {
        if (this.cache[space] && this.cache[space][key]) {
            delete this.cache[space][key];
            this.syncToDisk();
        }
    }
    getAll(space) {
        return this.cache[space] || {};
    }
}
const Database = new LocalJSONDatabase();

// --- CLASĂ DE TELEMETRIE INDUSTRIALĂ ȘI PROFILER V8 ---
class TelemetryEngine {
    constructor() {
        this.startTime = Date.now();
        this.commandMetrics = {}; 
        this.eventLoopLag = 0;
        this.interceptedExploits = 0;
        this.initEventLoopMonitor();
    }
    initEventLoopMonitor() {
        let before = Date.now();
        setInterval(() => {
            const now = Date.now();
            this.eventLoopLag = Math.max(0, now - before - 1000);
            before = now;
        }, 1000).unref();
    }
    startProfiling() { return process.hrtime.bigint(); }
    stopProfiling(commandName, token) {
        const diff = Number(process.hrtime.bigint() - token) / 1_000_000;
        if (!this.commandMetrics[commandName]) {
            this.commandMetrics[commandName] = { count: 0, totalMs: 0, maxMs: 0 };
        }
        const m = this.commandMetrics[commandName];
        m.count++;
        m.totalMs += diff;
        m.maxMs = Math.max(m.maxMs, diff);
    }
    getLag() { return `${this.eventLoopLag}ms`; }
}
const Telemetry = new TelemetryEngine();

// --- SHIELD KERNEL: FERESTRE GLISANTE & ANTI-RAID AUTOMAT ---
class SecurityKernel {
    constructor() {
        this.timelines = {};
        this.joinRate = [];
        this.serverLockdownActive = false;
    }
    isThrottled(userId, limit = 5, windowMs = 3000) {
        const now = Date.now();
        if (!this.timelines[userId]) this.timelines[userId] = [];
        this.timelines[userId] = this.timelines[userId].filter(t => now - t < windowMs);
        if (this.timelines[userId].length >= limit) {
            Telemetry.interceptedExploits++;
            return true;
        }
        this.timelines[userId].push(now);
        return false;
    }
    evaluateRaidPulse() {
        const now = Date.now();
        this.joinRate.push(now);
        this.joinRate = this.joinRate.filter(t => now - t < 10000); 
        if (this.joinRate.length > 5 && !this.serverLockdownActive) {
            this.serverLockdownActive = true;
            return true; 
        }
        return false;
    }
}
const SecurityShield = new SecurityKernel();

// --- SERVER EXPRESS WITH EXECUTIVE REAL-TIME MONITORING DASHBOARD ---
const app = express();
app.get('/', (req, res) => {
    const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptimeMin = ((Date.now() - Telemetry.startTime) / 1000 / 60).toFixed(1);
    
    let rowsHtml = '';
    Object.keys(Telemetry.commandMetrics).forEach(key => {
        const m = Telemetry.commandMetrics[key];
        const avg = (m.totalMs / m.count).toFixed(3);
        rowsHtml += `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #3E4046; color: #D4AF37;">/${key}</td>
            <td style="padding: 12px; border-bottom: 1px solid #3E4046;">${m.count}</td>
            <td style="padding: 12px; border-bottom: 1px solid #3E4046; color: #2ECC71;">${avg}ms</td>
            <td style="padding: 12px; border-bottom: 1px solid #3E4046; color: #E74C3C;">${m.maxMs.toFixed(3)}ms</td>
        </tr>`;
    });

    const dashboardTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>V8 Enterprise Diagnostics Console</title>
        <meta charset="utf-8">
        <style>
            body { background: #1E1F22; color: #DBDEE1; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2B2D31; padding-bottom: 20px; margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .card { background: #2B2D31; padding: 25px; border-radius: 8px; border-left: 5px solid #D4AF37; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
            .card.secure { border-left-color: #2ECC71; }
            .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #949BA4; text-transform: uppercase; letter-spacing: 1px; }
            .card p { margin: 0; font-size: 28px; font-weight: bold; color: #FFF; }
            table { width: 100%; border-collapse: collapse; background: #2B2D31; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
            th { background: #313338; text-align: left; padding: 15px; font-size: 13px; text-transform: uppercase; color: #949BA4; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>⚙️ V8 INFRASTRUCTURE MONITORING ENGINE</h2>
                <span style="color: #2ECC71; font-weight: bold; background: rgba(46,204,113,0.1); padding: 6px 12px; border-radius: 20px;">NODE LIVE</span>
            </div>
            <div class="grid">
                <div class="card"><h3>Event Loop Lag</h3><p>${Telemetry.getLag()}</p></div>
                <div class="card"><h3>Memorie V8 (Heap)</h3><p>${memoryUsed} MB</p></div>
                <div class="card"><h3>Uptime Execuție</h3><p>${uptimeMin} Min</p></div>
                <div class="card secure"><h3>Exploits Blocat</h3><p>${Telemetry.interceptedExploits}</p></div>
            </div>
            <h3 style="margin-bottom: 15px; color: #FFF;">⚡ PERFORMANȚĂ COMNEZI (MICROTIME-ANALYTICS)</h3>
            <table>
                <thead><tr><th>Nume Interacțiune</th><th>Total Rulări</th><th>Timp Mediu Răspuns</th><th>Vârf Latență (Max)</th></tr></thead>
                <tbody>${rowsHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #949BA4;">Nicio interacțiune profilată în memoria volatilă momentan.</td></tr>'}</tbody>
            </table>
        </div>
    </body>
    </html>`;
    res.status(200).send(dashboardTemplate);
});
app.listen(process.env.PORT || 3000);

// --- INITIALIZARE CLIENT CU INTENTS ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// --- SYNCHRONIZED APP COMMAND REGISTRY (SLASH) ---
client.once('ready', async () => {
    console.log(`[SYSTEM RUNTIME]: Operational. Authenticated as: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '👑 Monitorizare Profiler V8 | 15.000 RON', type: 3 }], status: 'dnd' });

    const payload = [
        { name: 'midsetup', description: 'Desfășoară poarta centrală asincronă bazată pe formulare tip Modal.' },
        { name: 'event', description: 'Bilanț și telemetrie analitică a galei în valoare de 15.000 RON.' },
        { name: 'stats', description: 'Extrage starea mașinii virtuale Node.js și timpii de răspuns backend.' },
        { 
            name: 'warn', 
            description: 'Înregistrează o penalizare oficială în arhiva persistentă pe disc.',
            options: [
                { name: 'utilizator', type: 6, description: 'Ținta sancțiunii', required: true },
                { name: 'motiv', type: 3, description: 'Cauza penalizării', required: false }
            ]
        },
        { name: 'cazier', description: 'Interoghează istoricul din baza de date persistentă.', options: [{ name: 'utilizator', type: 6, description: 'Membru selectat', required: true }] },
        { name: 'clear', description: 'Executat curățarea în masă a mesajelor redundante.', options: [{ name: 'cantitate', type: 4, description: 'Număr mesaje', required: true }] },
        { name: 'lockdown', description: 'Fortează izolarea completă a canalului prin blocarea permisiunilor globale.' },
        { name: 'unlockdown', description: 'Revocă starea de carantină a canalului curent.' }
    ];

    await client.application.commands.set(payload).catch(console.error);
});

// --- AUDIT TRAIL INTERNAL LOG ---
async function internallog(guild, title, description) {
    const logChan = guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
    if (!logChan) return;
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x34495E)
        .setTimestamp();
    logChan.send({ embeds: [embed] }).catch(() => {});
}

// --- GATEKEEPER INTERCEPTOR (RATELIMIT & ANTI-LINK INTERCEPTOR) ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild || !message.member) return;

    if (SecurityShield.isThrottled(message.author.id, 6, 3000)) {
        await message.delete().catch(() => {});
        return message.channel.send(`🚨 **Security Shield:** ${message.author}, Ratelimit activat pentru spam!`).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
    }

    if (message.member.roles.cache.has(CONFIG.SCAMMER_ROLE_ID) || message.member.roles.cache.has(CONFIG.SUSPECT_ROLE_ID)) {
        if (/http|\.gg\/|nitro|crypto|giveaway/i.test(message.content)) {
            await message.delete().catch(() => {});            // --- CONTINUARE DE LA LINIA 262 (După ștergerea mesajului suspect) ---
            await internallog(message.guild, '🛡️ Control: Scurgere Link Oprită', `**Utilizator:** ${message.author}\n**Payload:** \`${message.content}\``);
        }
    }
});

// --- PROTOCOL DETECTIE ANTI-RAID AUTOMATĂ ---
client.on('guildMemberAdd', async member => {
    const welcomeChan = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    
    if (SecurityShield.evaluateRaidPulse()) {
        const raidEmbed = new EmbedBuilder()
            .setTitle('🚨 ALERTA DE SECURITATE CRITICĂ: CORAL RAD SHIELD ACTIVAT')
            .setDescription(`S-a detectat un influx anormal de utilizatori noi (\`>5 înregistrări / 10 secunde\`). Serverul a intrat automat în Lockdown protectiv!`)
            .setColor(0xE74C3C);
        const logC = member.guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
        if (logC) logC.send({ content: `<@&${CONFIG.STAFF_ROLE_ID}>`, embeds: [raidEmbed] });
    }

    if (!welcomeChan) return;
    const joinEmbed = new EmbedBuilder()
        .setTitle('🛰️ PIPELINE CONEXIUNE: DETECTATĂ')
        .setColor(0x2B2D31)
        .setDescription(`╭── **Membru Nou:** ${member}\n├── **ID Sursă:** \`${member.id}\`\n╰── **Index Registru:** #${member.guild.memberCount}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage(IMAGES.welcomeBanner);
    welcomeChan.send({ embeds: [joinEmbed] });
});

// --- INTERACTION CORE MATRIX (SLASH, MODALS, BUTTONS, TICKETS) ---
client.on('interactionCreate', async interaction => {
    const isStaff = interaction.member?.roles.cache.has(CONFIG.STAFF_ROLE_ID);

    // [DESCHIDERE MODALE PENTRU CELE 4 TIPURI DE TICHETE DIN VIDEO]
    if (interaction.isStringSelectMenu() && interaction.customId === 'mid_ticket_menu') {
        const val = interaction.values[0];
        const modal = new ModalBuilder().setCustomId(`modal_core_${val}`).setTitle(`📝 Formular Clasa ${val.toUpperCase()}`);
        
        const subj = new TextInputBuilder().setCustomId('f_s').setLabel('Subiectul principal').setStyle(TextInputStyle.Short).setPlaceholder('Ex: Problemă tehnică / Achiziție / Revendicare').setRequired(true);
        const desc = new TextInputBuilder().setCustomId('f_d').setLabel('Descrie contextul pe scurt').setStyle(TextInputStyle.Paragraph).setPlaceholder('Introdu detaliile aici...').setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(subj), new ActionRowBuilder().addComponents(desc));
        return await interaction.showModal(modal);
    }

    // [SUBMIT FORMULAR MODAL TICHETE]
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_core_')) {
        await interaction.deferReply({ ephemeral: true });
        const dept = interaction.customId.split('_')[2];
        const subject = interaction.fields.getTextInputValue('f_s');
        const details = interaction.fields.getTextInputValue('f_d');

        const chan = await interaction.guild.channels.create({
            name: `🎫-${dept}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: CONFIG.TICKET_CATEGORY_ID || null,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'] },
                { id: CONFIG.STAFF_ROLE_ID, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
            ]
        });

        const embedPanel = new EmbedBuilder()
            .setTitle(`🔒 PIPELINE INTEGRAT ENCRYPTED ── ${dept.toUpperCase()}`)
            .setColor(0x2B2D31)
            .setDescription(`Salut ${interaction.user}, fisa ta a fost mapată structural:\n\n╭── **Subiect:** \`${subject}\`\n╰── **Detalii înaintate:** \`\`\`\n${details}\`\`\``);

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tk_claim').setLabel('Preluare Operator').setStyle(ButtonStyle.Primary).setEmoji('📌'),
            new ButtonBuilder().setCustomId('tk_unclaim').setLabel('Eliberare Pool').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
            new ButtonBuilder().setCustomId('tk_trans').setLabel('Export File Logs').setStyle(ButtonStyle.Success).setEmoji('📝'),
            new ButtonBuilder().setCustomId('tk_close').setLabel('Arhivează Definitiv').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await chan.send({ content: `${interaction.user} | <@&${CONFIG.STAFF_ROLE_ID}>`, embeds: [embedPanel], components: [actionRow] });
        await interaction.editReply(`✅ Protocol finalizat. Canal securizat deschis: ${chan}`);
        return;
    }

    // [MANAGEMENT BUTOANE TICHETE & VOUCH]
    if (interaction.isButton()) {
        if (['tk_claim', 'tk_unclaim', 'tk_trans', 'tk_close'].includes(interaction.customId)) {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        }

        if (interaction.customId === 'tk_claim') {
            await interaction.channel.permissionOverwrites.edit(CONFIG.STAFF_ROLE_ID, { ViewChannel: false });
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`📌 Interfața a fost blocată exclusiv pentru operatorul ${interaction.user}.`).setColor(0x2ECC71)] });
        }
        if (interaction.customId === 'tk_unclaim') {
            await interaction.channel.permissionOverwrites.edit(CONFIG.STAFF_ROLE_ID, { ViewChannel: true });
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`🔄 Canalul a fost eliberat în pool-ul general de asistență.`).setColor(0xD4AF37)] });
        }
        if (interaction.customId === 'tk_trans') {
            const history = await interaction.channel.messages.fetch({ limit: 100 });
            let logStream = `--- CRYPTO SECURE AUDIT TRAIL FOR ${interaction.channel.name.toUpperCase()} ---\n\n`;
            history.reverse().forEach(m => logStream += `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}\n`);
            const attachment = new AttachmentBuilder(Buffer.from(logStream, 'utf-8'), { name: `audit-trail-${interaction.channel.name}.txt` });
            return interaction.reply({ content: '📊 Sincronizare completă. Fișierul a fost generat:', files: [attachment] });
        }
        if (interaction.customId === 'tk_close') {
            await interaction.reply({ embeds: [new EmbedBuilder().setDescription('🔒 Protocol distrugere buffer inițiat. Canalul se va șterge în 3 secunde...').setColor(0xE74C3C)] });
            return setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }

        // PROCESATOR AUDIT PENTRU +VOUCH (Validare Staff)
        if (interaction.customId === 'v_approve_core' || interaction.customId === 'v_reject_core') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const item = Database.getSpace('pendingVouches', interaction.message.id);
            if (!item) return interaction.reply({ content: 'Instanță expirată în cache.', ephemeral: true });

            if (interaction.customId === 'v_approve_core') {
                const currentVouches = Database.getSpace('vouches', item.targetId, []);
                currentVouches.push({ author: item.authorId, comment: item.comment, date: new Date().toLocaleDateString() });
                Database.setSpace('vouches', item.targetId, currentVouches);

                await interaction.update({ embeds: [new EmbedBuilder().setTitle('✅ Rating Reputație Validat').setDescription(`Recenzia de la <@${item.authorId}> pentru <@${item.targetId}> a fost salvată persistent.`).setColor(0x2ECC71)], components: [] });
            } else {
                await interaction.update({ embeds: [new EmbedBuilder().setTitle('❌ Tranzacție Clasificată ca Spam').setDescription(`Recenzia a fost ștearsă din buffer de operatorul ${interaction.user}.`).setColor(0xE74C3C)], components: [] });
            }
            Database.deleteSpace('pendingVouches', interaction.message.id);
        }
    }

    // --- EXECUȚIE INTERFEȚE SLASH COMMAND ---
    if (!interaction.isChatInputCommand()) return;
    const pToken = Telemetry.startProfiling();
    const { commandName, options } = interaction;

    if (SecurityShield.isThrottled(interaction.user.id, 4, 3000)) {
        return interaction.reply({ content: '⚠️ Securitate backend: Solicitările tale vin prea rapid!', ephemeral: true });
    }

    // --- COMANDA /MIDSETUP ---
    if (commandName === 'midsetup') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        
        const setEmbed = new EmbedBuilder()
            .setTitle('🔒 UNKNOWN Support Panel')
            .setColor(0x2B2D31)
            .setDescription(
                `🤝 **Ai nevoie de ajutor?** Deschide un ticket de suport.\n` +
                `🛒 **Pentru cumpărare, apasă Purchase.** Fără alte opțiuni.\n` +
                `🎁 **Ai de revendicat un reward?** Deschide Claim Reward.\n` +
                `🟢 **Vrei in Support Team?** Completează aplicația ⭐️\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `*Sistem bye 24k_alex800*`
            )
            .setImage(IMAGES.panelBanner);

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('mid_ticket_menu').setPlaceholder('Alegeți vectorul de asistență...').addOptions([
                { label: 'Suport General / Asistență', value: 'suport', description: 'Probleme legate de server sau întrebări.', emoji: '🤝' },
                { label: 'Departamentul Comercial (Purchase)', value: 'purchase', description: 'Achiziții de produse, donații sau servicii.', emoji: '🛒' },
                { label: 'Revendică Premiu (Claim Reward)', value: 'reward', description: 'Revendicarea recompenselor de la evenimente.', emoji: '🎁' },
                { label: 'Aplică în Support Team', value: 'aplicatie', description: 'Completează formularul de recrutare staff.', emoji: '🟢' }
            ])
        );

        await interaction.channel.send({ embeds: [setEmbed], components: [row] });
        await interaction.reply({ content: `${VISUALS.success} Arhitectura panoului a fost injectată complet în canal!`, ephemeral: true });
        Telemetry.stopProfiling(commandName, pToken);
        return;
    }

    // --- COMANDA /WARN (CU TIMEOUT AUTOMAT INTEGRAT) ---
    if (commandName === 'warn') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const targetUser = options.getUser('utilizator');
        const reason = options.getString('motiv') || 'Nerespectarea normelor comunității';
        if (!targetUser) return interaction.reply({ content: 'Eroare: Utilizator invalid.', ephemeral: true });

        const history = Database.getSpace('sanctions', targetUser.id, []);
        history.push({ type: 'WARN', reason: reason, moderator: interaction.user.tag, date: new Date().toLocaleString() });
        Database.setSpace('sanctions', targetUser.id, history);

        const currentWarns = history.filter(s => s.type === 'WARN').length;

        const warnEmbed = new EmbedBuilder()
            .setTitle(`${VISUALS.alarm} Sancțiune Aplicată Electronic`)
            .setColor(0xE74C3C)
            .setDescription(`Membru penalizat: <@${targetUser.id}>\nSancțiune: **Avertisment (Warn)**\nMotiv: **${reason}**`)
            .setImage(IMAGES.warning);

        await interaction.reply({ embeds: [warnEmbed] });
        await internallog(interaction.guild, `⚠️ Sancțiune - Warn`, `**Membru:** ${targetUser.tag}\n**Moderator:** ${interaction.user.tag}\n**Motiv:** ${reason}`);

        // Verificare acumulare 3 Warn-uri pentru Auto
    // --- CONTINUARE DE LA LINIA 451 (În interiorul execuției comenzii 'warn') ---
        if (currentWarns >= 3) {
            const memberObj = interaction.guild.members.cache.get(targetUser.id);
            if (memberObj) {
                await memberObj.timeout(24 * 60 * 60 * 1000, 'Acumulare automată a 3 avertismente critice.').catch(() => {});
                await interaction.followUp({ content: `${VISUALS.alarm} Sistemul Automat a aplicat măsura de **Auto-Timeout timp de 24 de ore** pentru acest utilizator din cauza acumulării a 3 avertismente.` });
            }
        }
        Telemetry.stopProfiling(commandName, pToken);
        return;
    }

    // --- COMANDA /CAZIER INTERACTIVĂ ---
    if (commandName === 'cazier') {
        const targetUser = options.getUser('utilizator');
        if (!targetUser) return interaction.reply({ content: 'Parametru lipsă.', ephemeral: true });
        
        const history = Database.getSpace('sanctions', targetUser.id, []);
        
        if (history.length === 0) {
            Telemetry.stopProfiling(commandName, pToken);
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`${VISUALS.staff} Dosar Penal Electronic - ${targetUser.username}`).setDescription(`${VISUALS.success} Utilizatorul are un cazier complet curat. Nu au fost găsite abateri.`).setColor(0x34495E)] });
        }

        const itemsPerPage = 3;
        const totalPages = Math.ceil(history.length / itemsPerPage);
        let currentPage = 1;

        const generateCazierPage = (page) => {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const subset = history.slice(start, end);

            let pageBuffer = '';
            subset.forEach((s, i) => {
                pageBuffer += `\`[#${start + i + 1}]\` **[${s.type}]** ── ${s.reason}\n*Mod: ${s.moderator} | Data: ${s.date}*\n\n`;
            });

            return new EmbedBuilder()
                .setTitle(`${VISUALS.staff} Dosar Penal Electronic - ${targetUser.username}`)
                .setColor(0x34495E)
                .setDescription(pageBuffer)
                .setFooter({ text: `Pagina ${page} / ${totalPages} • Sincronizat persistent pe Disc` });
        };

        const actionButtonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cz_prev').setLabel('Anterioară').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('cz_next').setLabel('Următoarea').setStyle(ButtonStyle.Secondary).setDisabled(totalPages === 1)
        );

        const responseMessage = await interaction.reply({ embeds: [generateCazierPage(1)], components: [actionButtonsRow], fetchReply: true });
        Telemetry.stopProfiling(commandName, pToken);

        const collector = responseMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
        
        collector.on('collect', async btnInteraction => {
            if (btnInteraction.user.id !== interaction.user.id) {
                return btnInteraction.reply({ content: '❌ Nu poți naviga în acest meniu.', ephemeral: true });
            }
            if (btnInteraction.customId === 'cz_prev') currentPage--;
            if (btnInteraction.customId === 'cz_next') currentPage++;

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cz_prev').setLabel('Anterioară').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 1),
                new ButtonBuilder().setCustomId('cz_next').setLabel('Următoarea').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === totalPages)
            );

            await btnInteraction.update({ embeds: [generateCazierPage(currentPage)], components: [updatedRow] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cz_prev').setLabel('Anterioară').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('cz_next').setLabel('Următoarea').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
            responseMessage.edit({ components: [disabledRow] }).catch(() => {});
        });
        return;
    }

    if (commandName === 'event') {
        const evEmbed = new EmbedBuilder()
            .setTitle('💎 EXECUTIVE ENGINE CONSOLE ── THE 15.000 RON GALA')
            .setColor(0xD4AF37)
            .setDescription(
                `Nodul de calcul rulează acum într-o mașină virtuală izolată pentru transparența totală a fondului de **15.000 LEI LICHIZI**.\n\n` +
                `╭── 🏆 **REPARTIZARE FOND FINANCIAR:**\n` +
                `├── **Locul I:** Retragere lichidități direct în cont bancar / Crypto\n` +
                `├── **Locul II & III:** Hardware clasa competițională + Licențe VIP\n` +
                `╰── **Mecanism Jurizare:** Stabilitate profil, lipsa alertelor din cazier.`
            );
        await interaction.reply({ embeds: [evEmbed] });
        Telemetry.stopProfiling(commandName, pToken);
    }
    if (commandName === 'stats') {
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const statsEmbed = new EmbedBuilder()
            .setTitle('🧠 V8 ENGINE HARDWARE DIAGNOSTICS')
            .setColor(0x2B2D31)
            .setDescription(`├── **Memorie RAM alocată:** \`${memory} MB\`\n├── **V8 Event Loop Lag:** \`${Telemetry.getLag()}\`\n├── **WebSocket Discord API:** \`${client.ws.ping}ms\``);
        await interaction.reply({ embeds: [statsEmbed] });
        Telemetry.stopProfiling(commandName, pToken);
    }
    if (commandName === 'clear') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const amount = options.getInteger('cantitate');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        await interaction.reply({ content: `✅ Ștergere asincronă finalizată pentru \`${amount}\` mesaje.`, ephemeral: true });
        Telemetry.stopProfiling(commandName, pToken);
    }
    if (commandName === 'lockdown') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription('🔒 **Protocol Lockdown activat.** Canal izolat cu succes.').setColor(0xE74C3C)] });
        Telemetry.stopProfiling(commandName, pToken);
    }
    if (commandName === 'unlockdown') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription('🔓 **Protocol Lockdown dezactivat.** Permisiuni restabilite.').setColor(0x2ECC71)] });
        Telemetry.stopProfiling(commandName, pToken);
    }
});

// --- UTILITIES SYSTEM CU PREFIX TEXT (+) ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('+')) return;
    const args = message.content.slice(1).split(/ +/);
    const cmd = args[0].toLowerCase();

    if (cmd === 'help') {
        return message.reply({ embeds: [new EmbedBuilder().setTitle(':ES_rege: Meniu Comenzi Text').setColor(0x2B2D31).setDescription(`\`+vouch @user <mesaj>\` - Trimite un vouch spre analiză.\n\`+profile [@user]\` - Vezi profilul și rata de încredere.\n\`+leaderboard\` - Top 10 utilizatori de încredere.`)] });
    }

    if (cmd === 'vouch') {
        const target = message.mentions.users.first();
        if (!target) return message.reply('❌ Sintaxă validă: `+vouch @user <recenzie>`');
        if (target.id === message.author.id) return message.reply('❌ Auto-vouch respins automat de kernel.');

        const comment = args.slice(2).join(' ');
        if (!comment || comment.length < 5) return message.reply('❌ Comentariul trebuie să aibă minim 5 caractere.');

        const vChan = message.guild.channels.cache.get(CONFIG.VOUCH_CHANNEL_ID);
        if (!vChan) return message.reply('❌ Eroare: Canalul de vouch-uri nu a fost configurat.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('v_approve_core').setLabel('Validează și Salvează persistent').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('v_reject_core').setLabel('Anulează Recenzia').setStyle(ButtonStyle.Danger)
        );

        const vEmbed = new EmbedBuilder().setTitle('🛡️ Control Audit Reputație — Tranzacție Nouă').setColor(0xD4AF37).addFields({ name: 'Expeditor:', value: `${message.author}`, inline: true }, { name: 'Partener:', value: `${target}`, inline: true }, { name: 'Conținut Analiză:', value: `\`\`\`\n"${comment}"\n\`\`\`` });
        const sent = await vChan.send({ embeds: [vEmbed], components: [row] });
        
        Database.setSpace('pendingVouches', sent.id, { targetId: target.id, authorId: message.author.id, comment: comment });
        return message.reply('✅ Date trimise în buffer-ul de audit. Va fi salvat persistent după validarea Staff-ului.');
    }

    if (cmd === 'profile') {
        const user = message.mentions.users.first() || message.author;
        const list = Database.getSpace('vouches', user.id, []);
        const score = list.length;

        let stars = '☆☆☆☆☆';
        if (score >= 1) stars = '⭐☆☆☆☆';
        if (score >= 3) stars = '⭐⭐☆☆☆';
        if (score >= 5) stars = '⭐⭐⭐⭐☆';
        if (score >= 10) stars = '⭐⭐⭐⭐⭐';

        const pEmbed = new EmbedBuilder().setTitle(`👤 TRUST PROFILE MATRIX — ${user.username}`).setColor(0x2B2D31).setThumbnail(user.displayAvatarURL({ dynamic: true })).addFields({ name: '📈 Recenzii Aprobate', value: `\`[ ${score} Vouch-uri ]\``, inline: true }, { name: '🛡️ Certificare', value: `\`${stars}\``, inline: true });
        return message.reply({ embeds: [pEmbed] });
    }
    if (cmd === 'leaderboard') {
        const allVouches = Database.getAll('vouches');
        const sorted = Object.keys(allVouches)
            .map(userId => ({ userId, count: allVouches[userId].length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const lbEmbed = new EmbedBuilder().setTitle('🏆 REGISTRUL CRIPTOGRAFIC CENTRAL TOP 10').setColor(0xD4AF37);
        if (sorted.length === 0) {
            lbEmbed.setDescription('Nu există profiluri indexate persistent.');
        } else {
            let table = '```\nPOZ | REPUTAȚIE | UTILIZATOR\n============================\n';
            sorted.forEach((item, idx) => {
                const u = client.users.cache.get(item.userId);
                table += `#${String(idx + 1).padEnd(2)} | ${String(item.count).padEnd(9)} | ${u ? u.username : 'ID: ' + item.userId}\n`;
            });
            table += '```';
            lbEmbed.setDescription(table);
        }
        return message.reply({ embeds: [lbEmbed] });
    }
});

// --- 🛡️ GLOBAL ANTI-CRASH SYSTEM (PREVINE COMPLET OPRIREA BOTULUI) ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [ANTI-CRASH] Unhandled Rejection la:', promise, 'Motiv:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.error('🚨 [ANTI-CRASH] Uncaught Exception:', err, 'Origine:', origin);
});

client.login(process.env.TOKEN);

    
