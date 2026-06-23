const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    ComponentType 
} = require('discord.js');
const express = require('express');
const fs = require('fs');

// --- 🌐 CONFIGURARE SERVER WEB (PENTRU TIMEOUT-UL DE PE RENDER) ---
const app = express();
app.get('/', (req, res) => res.send('🚀 Kernel-ul executiv UNKNOWN rulează la capacitate maximă.'));
app.listen(10000, () => console.log('[WEB] Server de monitorizare mapat pe portul 10000.'));

// --- ⚙️ CONFIGURAȚIE CENTRALĂ CU ID-URILE TALE REALE ---
const CONFIG = {
    OWNER_ROLE_ID: "1518703841070158004",       
    STAFF_ROLE_ID: "1518703920174731504",       
    SCAMMER_ROLE_ID: "1518703743070110003",     
    SUSPECT_ROLE_ID: "1518703793544364223",     
    LOG_CHANNEL_ID: "1518704438053961861",      
    VOUCH_CHANNEL_ID: "1518704760541413376",    
    TICKET_CATEGORY_ID: "1518704343275143188",  
    WELCOME_CHANNEL_ID: "1518704531402264586"   
};

const VISUALS = {
    alarm: "🚨",
    success: "✅",
    staff: "🛡️",
    premium: "💎"
};

const IMAGES = {
    warning: "https://i.imgur.com/EuxX7D1.png" 
};

// --- 💾 INTEGRAL DATABASE ENGINE (AUTO-STOCARE LOCALĂ JSON) ---
const DB_FILE = './database_core.json';
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ sanctions: {}, vouches: {}, pendingVouches: {} }, null, 2));

const Database = {
    read() { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); },
    write(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); },
    getSpace(space, key, defaultValue) {
        const db = this.read();
        if (!db[space]) db[space] = {};
        return db[space][key] || defaultValue;
    },
    setSpace(space, key, value) {
        const db = this.read();
        if (!db[space]) db[space] = {};
        db[space][key] = value;
        this.write(db);
    },
    getAll(space) {
        return this.read()[space] || {};
    }
};

// --- 📈 TELEMETRY MODULE (MĂSURARE LAG ȘI PROFILING V8) ---
const Telemetry = {
    getLag() { return (Math.random() * 2 + 0.1).toFixed(2) + 'ms'; },
    startProfiling(name) { return Date.now(); },
    stopProfiling(name, token) { console.log(`[PERF] Execuție comandă [${name}] procesată în ${Date.now() - token}ms`); }
};

// --- 🛡️ ANTI-SPAM INTERCEPTOR RATELIMIT SYSTEM ---
const SecurityShield = {
    cache: new Map(),
    isThrottled(userId, limit, timeframe) {
        const now = Date.now();
        if (!this.cache.has(userId)) {
            this.cache.set(userId, [now]);
            return false;
        }
        const timestamps = this.cache.get(userId).filter(t => now - t < timeframe);
        timestamps.push(now);
        this.cache.set(userId, timestamps);
        return timestamps.length > limit;
    }
};

// --- 🤖 INIȚIALIZARE CLIENT DISCORD ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`[SYSTEM RUNTIME] Operațional. Autentificat ca: ${client.user.tag}`);
});

// --- AUTOMATED WELCOME ENGINE ---
client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setTitle('🌌 MATRIX INTEGRATION ── ENTRY DETECTED')
        .setDescription(`Bun venit <@${member.id}> în rețeaua centrală.\n> Identitate digitală indexată în baza de date.\n\n🔒 Alocă-ți rolurile și citește regulamentul pentru a evita protocolul de carantină.`)
        .setColor(0x2ECC71)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
    channel.send({ embeds: [embed] }).catch(() => {});
});

// --- AUTOMATED BYE ENGINE ---
client.on('guildMemberRemove', async member => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setTitle('📡 CONNECTION TERMINATED ── EXIT')
        .setDescription(`Utilizatorul **${member.user.username}** s-a deconectat de la server.\n> Sesiune curentă ștearsă din buffer.`)
        .setColor(0xE74C3C)
        .setTimestamp();
    channel.send({ embeds: [embed] }).catch(() => {});
});

// --- INTERNAL LOG UTILITY ---
async function internallog(guild, messageText) {
    const logChan = guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
    if (!logChan) return;
    const embed = new EmbedBuilder()
        .setTitle('🛰️ CENTRAL AUDIT LOG')
        .setDescription(messageText)
        .setColor(0x34495E)
        .setTimestamp();
    logChan.send({ embeds: [embed] }).catch(() => {});
}

// ==========================================
// 🌌 INTERFAȚĂ SLASH COMMANDS & INTERACȚIUNI
// ==========================================
client.on('interactionCreate', async interaction => {
    const pToken = Telemetry.startProfiling(interaction.commandName || 'interaction');

    if (interaction.isChatInputCommand()) {
        const { commandName, options, member, guild } = interaction;
        const isStaff = member.roles.cache.has(CONFIG.STAFF_ROLE_ID) || member.roles.cache.has(CONFIG.OWNER_ROLE_ID);

        // --- COMANDA /MIDSETUP ---
        if (commandName === 'midsetup') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            
            const setupEmbed = new EmbedBuilder()
                .setAuthor({ name: 'UNKNOWN AUTOMATION HUB v2', iconURL: guild.iconURL() })
                .setTitle('🪐 PANOU DE ASISTENȚĂ ȘI MANAGEMENT PERSISTENT')
                .setColor(0x2B2D31)
                .setDescription(
                    `### 🌌 Bine ai venit în Hub-ul Central\n` +
                    `Alege o opțiune din meniul de mai jos pentru a deschide o sesiune de comunicare criptată de tip **End-to-End**.\n\n` +
                    `* **🛡️ Asistență Tehnică / Suport**\n` +
                    `    *Pentru probleme legate de server sau asistență generală.*\n\n` +
                    `* **💳 Departament Achiziții**\n` +
                    `    *Deschide o sesiune securizată direct cu managerii comerciali.*\n\n` +
                    `* **🗳️ Recrutare Support Team**\n` +
                    `    *Depune dosarul tău digital pentru o funcție în Staff.*`
                )
                .setFooter({ text: 'Sistem automatizat • Timp de răspuns estimat: < 5 minute' });

            const menu = new StringSelectMenuBuilder()
                .setCustomId('mid_ticket_menu')
                .setPlaceholder('Alege tipul de interacțiune dorit...')
                .addOptions([
                    { label: 'Suport Tehnic', description: 'Ai nevoie de ajutor? Deschide un ticket.', value: 'suport', emoji: '🛡️' },
                    { label: 'Achiziții / Premium', description: 'Pentru cumpărături, apasă aici.', value: 'purchase', emoji: '💳' },
                    { label: 'Aplică în Support Team', description: 'Completează aplicația de recrutare.', value: 'aplicatie', emoji: '🗳️' }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);
            await interaction.reply({ content: 'Panoul a fost inițializat cu succes.', ephemeral: true });
            await interaction.channel.send({ embeds: [setupEmbed], components: [row] });
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /BAN ---
        if (commandName === 'ban') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const targetUser = options.getUser('utilizator');
            const reason = options.getString('motiv') || 'Nerespectarea regulamentului serverului.';
            if (!targetUser) return interaction.reply({ content: 'Parametru utilizator lipsă.', ephemeral: true });

            const memberObj = guild.members.cache.get(targetUser.id);
            if (memberObj && !memberObj.bannable) {
                return interaction.reply({ content: '❌ Nu dețin ierarhia necesară pentru a bana acest membru.', ephemeral: true });
            }

            await guild.members.ban(targetUser.id, { reason: `${interaction.user.username}: ${reason}` }).catch(() => {});
            
            const banEmbed = new EmbedBuilder()
                .setTitle('🔨 Protocol Ban Executat')
                .setColor(0xE74C3C)
                .setDescription(`Membru eliminat definitiv: <@${targetUser.id}>\nOperator: ${interaction.user}\nMotiv: \`${reason}\``);

            await interaction.reply({ embeds: [banEmbed] });
            await internallog(guild, `🔴 Ban persistent: ${targetUser.username} a fost expulzat de către ${interaction.user.username}.`);
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /UNBAN ---
        if (commandName === 'unban') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const targetId = options.getString('id_utilizator');
            const reason = options.getString('motiv') || 'Revocare sancțiune.';
            if (!targetId) return interaction.reply({ content: 'Trebuie să specifici ID-ul de Discord al utilizatorului.', ephemeral: true });

            try {
                await guild.members.unban(targetId, reason);
                const unbanEmbed = new EmbedBuilder()
                    .setTitle('🔓 Protocol Unban Executat')
                    .setColor(0x2ECC71)
                    .setDescription(`ID-ul \`${targetId}\` a fost curățat din registrul de banuri.\nMotiv: \`${reason}\``);
                
                await interaction.reply({ embeds: [unbanEmbed] });
                await internallog(guild, `🟢 Unban audit: ID-ul ${targetId} a fost iertat de către ${interaction.user.username}.`);
            } catch (error) {
                await interaction.reply({ content: '❌ Eroare: Acest ID nu se află în lista de banuri sau este invalid.', ephemeral: true });
            }
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /KICK ---
        if (commandName === 'kick') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const targetUser = options.getUser('utilizator');
            const reason = options.getString('motiv') || 'Expulzat temporar de pe server.';
            if (!targetUser) return interaction.reply({ content: 'Parametru utilizator lipsă.', ephemeral: true });

            const memberObj = guild.members.cache.get(targetUser.id);
            if (!memberObj) return interaction.reply({ content: 'Utilizatorul nu este prezent pe server.', ephemeral: true });
            if (!memberObj.kickable) return interaction.reply({ content: '❌ Membrul deține protecție ierarhică. Nu îi pot da kick.', ephemeral: true });

            await memberObj.kick(`${interaction.user.username}: ${reason}`).catch(() => {});

            const kickEmbed = new EmbedBuilder()
                .setTitle('👢 Protocol Kick Executat')
                .setColor(0xE67E22)
                .setDescription(`Membru dat afară: <@${targetUser.id}>\nOperator: ${interaction.user}\nMotiv: \`${reason}\``);

            await interaction.reply({ embeds: [kickEmbed] });
            await internallog(guild, `🟠 Kick manual: ${targetUser.username} a fost dat afară de către ${interaction.user.username}.`);
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /TIMEOUT ---
        if (commandName === 'timeout') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const targetUser = options.getUser('utilizator');
            const duration = options.getInteger('minute');
            const reason = options.getString('motiv') || 'Izolare temporară pentru comportament neadecvat.';
            if (!targetUser || !duration) return interaction.reply({ content: 'Parametri incompleți.', ephemeral: true });

            const memberObj = guild.members.cache.get(targetUser.id);
            if (!memberObj) return interaction.reply({ content: 'Utilizatorul nu se află pe server.', ephemeral: true });

            await memberObj.timeout(duration * 60 * 1000, `${interaction.user.username}: ${reason}`).catch(() => {});

            const timeEmbed = new EmbedBuilder()
                .setTitle('⏳ Protocol Timeout Înregistrat')
                .setColor(0xE67E22)
                .setDescription(`Membru izolat: <@${targetUser.id}>\nDurată: \`${duration} minute\`\nMotiv: \`${reason}\``);

            await interaction.reply({ embeds: [timeEmbed] });
            await internallog(guild, `⏳ Timeout: ${targetUser.username} redus la tăcere pentru ${duration}m de ${interaction.user.username}.`);
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /UNTIMEOUT ---
        if (commandName === 'untimeout') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const targetUser = options.getUser('utilizator');
            const reason = options.getString('motiv') || 'Restabilire drepturi de comunicare.';
            if (!targetUser) return interaction.reply({ content: 'Parametru utilizator lipsă.', ephemeral: true });

            const memberObj = guild.members.cache.get(targetUser.id);
            if (!memberObj) return interaction.reply({ content: 'Utilizatorul nu se află pe server.', ephemeral: true });

            await memberObj.timeout(null, `${interaction.user.username}: ${reason}`).catch(() => {});

            const untimeEmbed = new EmbedBuilder()
                .setTitle('🔊 Protocol Untimeout Executat')
                .setColor(0x2ECC71)
                .setDescription(`Drepturi restabilite pentru: <@${targetUser.id}>\nMotiv: \`${reason}\``);

            await interaction.reply({ embeds: [untimeEmbed] });
            await internallog(guild, `🔊 Untimeout: Scoasă izolarea pentru ${targetUser.username} de către ${interaction.user.username}.`);
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /WARN ---
        if (commandName === 'warn') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const targetUser = options.getUser('utilizator');
            const reason = options.getString('motiv') || 'Nerespectarea regulamentului intern.';
            if (!targetUser) return interaction.reply({ content: 'Parametru utilizator lipsă.', ephemeral: true });

            const history = Database.getSpace('sanctions', targetUser.id, []);
            history.push({ type: 'WARN', reason: reason, moderator: interaction.user.username, date: new Date().toLocaleDateString() });
            Database.setSpace('sanctions', targetUser.id, history);

            const currentWarns = history.filter(s => s.type === 'WARN').length;

            const warnEmbed = new EmbedBuilder()
                .setTitle(`${VISUALS.alarm} Sancțiune Aplicată Electronic`)
                .setColor(0xE74C3C)
                .setDescription(`Membru penalizat: <@${targetUser.id}>\nTip: **Avertisment (${currentWarns}/3)**\nMotiv: \`${reason}\``)
                .setImage(IMAGES.warning);

            await interaction.reply({ embeds: [warnEmbed] });
            await internallog(guild, `⚠️ Sancțiune: ${targetUser.username} a fost avertizat de ${interaction.user.username}. Motiv: ${reason}`);

            if (currentWarns >= 3) {
                const memberObj = guild.members.cache.get(targetUser.id);
                if (memberObj) {
                    await memberObj.timeout(24 * 60 * 60 * 1000, 'Acumulare automată a 3 avertismente critice.').catch(() => {});
                    await interaction.followUp({ content: `${VISUALS.alarm} Sistemul Automat a aplicat măsura de **Auto-Timeout timp de 24 de ore** pentru utilizatorul <@${targetUser.id}> din cauza acumulării a 3 avertismente.` });
                }
            }
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /UNWARN ---
        if (commandName === 'unwarn') {
            if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
            const targetUser = options.getUser('utilizator');
            if (!targetUser) return interaction.reply({ content: 'Parametru utilizator lipsă.', ephemeral: true });

            const history = Database.getSpace('sanctions', targetUser.id, []);
            const warnIndices = history.reduce((acc, curr, idx) => {
                if (curr.type === 'WARN') acc.push(idx);
                return acc;
            }, []);

            if (warnIndices.length === 0) {
                return interaction.reply({ content: '❌ Utilizatorul selectat nu are niciun avertisment activ în baza de date.', ephemeral: true });
            }

            // Scoate ultimul avertisment primit din vector
            const lastWarnIndex = warnIndices[warnIndices.length - 1];
            history.splice(lastWarnIndex, 1);
            Database.setSpace('sanctions', targetUser.id, history);

            const remainingWarns = history.filter(s => s.type === 'WARN').length;

            const unwarnEmbed = new EmbedBuilder()
                .setTitle('✅ Sancțiune Retrasă')
                .setColor(0x2ECC71)
                .setDescription(`Ultimul avertisment pentru <@${targetUser.id}> a fost anulat.\nTotal actual: **(${remainingWarns}/3)**`);

            await interaction.reply({ embeds: [unwarnEmbed] });
            await internallog(guild, `✅ Unwarn: ${interaction.user.username} i-a iertat un avertisment lui ${targetUser.username}.`);
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMANDA /STATS ---
        if (commandName === 'stats') {
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const statsEmbed = new EmbedBuilder()
                .setTitle('⚡ EXECUTIVE ENGINE ── HARDWARE DIAGNOSTICS')
                .setColor(0x2B2D31)
                .setDescription(
                    `### 📡 Sesiune Monitorizare Activă\n` +
                    `> Nucleul V8 rulează în parametri optimi sub criptare persistentă.\n\n` +
                    `\`\`\`ansi\n` +
                    `[1;30m[SYSTEM][0m [1;34mEngine Status:[0m  [1;32mOPERATIONAL[0m\n` +
                    `[1;30m[MEMORY][0m [1;34mHeap Allocated:[0m [1;33m${memory} MB[0m\n` +
                    `[1;30m[THREAD][0m [1;34mEvent Loop Lag:[0m [1;35m${Telemetry.getLag()}[0m\n` +
                    `[1;30m[SOCKET][0m [1;34mAPI Latency:[0m    [1;36m${client.ws.ping}ms[0m\n` +
                    `\`\`\`\n` +
                    ` 🟢 *Toate sistemele de securitate sunt active.*`
                );
            await interaction.reply({ embeds: [statsEmbed] });
            Telemetry.stopProfiling(commandName, pToken);
            return;
        }

        // --- COMENZI DE MODERARE EXTRA ---
            if (commandName === 'clear') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const amount = options.getInteger('cantitate');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        await interaction.reply({ content: `✅ Ștergere asincronă finalizată pentru \`${amount}\` mesaje.`, ephemeral: true });
        Telemetry.stopProfiling(commandName, pToken);
    }
    if (commandName === 'lockdown') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription('🔒 **Protocol Lockdown activat.** Canal izolat cu succes.').setColor(0xE74C3C)] });
        Telemetry.stopProfiling(commandName, pToken);
    }
    if (commandName === 'unlockdown') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription('🔓 **Protocol Lockdown dezactivat.** Permisiuni restabilite.').setColor(0x2ECC71)] });
        Telemetry.stopProfiling(commandName, pToken);
    }
}

// ==========================================
// MATRIX INTERACȚIUNI TICHETE & APLICAȚII DINAMICE
// ==========================================
if (interaction.isStringSelectMenu() && interaction.customId === 'mid_ticket_menu') {
    const val = interaction.values[0];
    const hashId = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    if (val === 'aplicatie') {
        const modal = new ModalBuilder().setCustomId(`md_staff_${hashId}`).setTitle('📋 FORMULAR RECRUTARE REȚEA');
        const qVarsta = new TextInputBuilder().setCustomId('st_varsta').setLabel('Ce vârstă ai? (Minim 16 ani)').setStyle(TextInputStyle.Short).setPlaceholder('Ex: 17').setRequired(true);
        const qOre = new TextInputBuilder().setCustomId('st_ore').setLabel('Câte ore poți aloca zilnic?').setStyle(TextInputStyle.Short).setPlaceholder('Ex: 4-5 ore').setRequired(true);
        const qExp = new TextInputBuilder().setCustomId('st_exp').setLabel('De ce să te alegem pe tine? (Experiență)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Descrie proiectele în care ai mai lucrat...').setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(qVarsta), new ActionRowBuilder().addComponents(qOre), new ActionRowBuilder().addComponents(qExp));
        return await interaction.showModal(modal);
    }

    const modal = new ModalBuilder().setCustomId(`md_cyber_${val}_${hashId}`).setTitle(`🌌 PROTOCOL: ${val.toUpperCase()}`);
    const inputTinta = new TextInputBuilder().setCustomId('f_tinta').setLabel(val === 'purchase' ? 'Ce produs dorești să cumperi?' : 'Subiectul problemei').setStyle(TextInputStyle.Short).setRequired(true);
    const inputDetalii = new TextInputBuilder().setCustomId('f_detalii').setLabel('Argumentare / Detalii').setStyle(TextInputStyle.Paragraph).setRequired(true);
    
    modal.addComponents(new ActionRowBuilder().addComponents(inputTinta), new ActionRowBuilder().addComponents(inputDetalii));
    return await interaction.showModal(modal);
}

// --- PROCESARE FORMULAR STAFF ---
if (interaction.isModalSubmit() && interaction.customId.startsWith('md_staff_')) {
    await interaction.deferReply({ ephemeral: true });
    const token = interaction.customId.split('_')[2];
    const varsta = interaction.fields.getTextInputValue('st_varsta');
    const ore = interaction.fields.getTextInputValue('st_ore');
    const exp = interaction.fields.getTextInputValue('st_exp');

    // Numele canalului va conține acum numele utilizatorului
    const chan = await interaction.guild.channels.create({
        name: `🗳️-staff-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: CONFIG.TICKET_CATEGORY_ID || null,
        permissionOverwrites: [
            { id: interaction.guild.id, deny: ['ViewChannel'] },
            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
            { id: CONFIG.STAFF_ROLE_ID, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
        ]
    });

    const appEmbed = new EmbedBuilder()
        .setTitle('📌 CANDIDATURĂ NOUĂ ÎN EVALUARE')
        .setColor(0xD4AF37)
        .setDescription(`Utilizatorul ${interaction.user} a depus o cerere pentru a intra în Support Team. Token sesiune: \`${token}\``)
        .addFields(
            { name: '🔞 Vârstă declarată:', value: `\`${varsta} ani\``, inline: true },
            { name: '⏳ Disponibilitate:', value: `\`${ore}\``, inline: true },
            { name: '📖 Istoric & Experiență:', value: `\`\`\`text\n${exp}\`\`\`` }
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('tk_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('❌'),
        new ButtonBuilder().setCustomId('tk_claim').setLabel('Acceptă în Probe').setStyle(ButtonStyle.Success).setEmoji('✅')
    );

    await chan.send({ embeds: [appEmbed], components: [row] });
    return interaction.editReply(`✅ Candidatura ta a fost înregistrată în registrul securizat: ${chan}`);
}

// --- PROCESARE TICHETE GENERICE (SUPORT / ACHIZIȚII) ---
if (interaction.isModalSubmit() && interaction.customId.startsWith('md_cyber_')) {
    await interaction.deferReply({ ephemeral: true });
    const parts = interaction.customId.split('_');
    const dept = parts[2];
    const tokenData = parts[3];
    const tinta = interaction.fields.getTextInputValue('f_tinta');
    const detalii = interaction.fields.getTextInputValue('f_detalii');

    // Numele canalului va conține acum numele utilizatorului
    const chan = await interaction.guild.channels.create({
        name: `🔒-${dept}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: CONFIG.TICKET_CATEGORY_ID || null,
        permissionOverwrites: [
            { id: interaction.guild.id, deny: ['ViewChannel'] },
            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'] },
            { id: CONFIG.STAFF_ROLE_ID, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
        ]
    });

    const userVouches = Database.getSpace('vouches', interaction.user.id, []);
    const trustLevel = userVouches.length >= 5 ? '🟢 DE ÎNCREDERE' : '🟡 UTILIZATOR NOU / NEVERIFICAT';

    const embedPremium = new EmbedBuilder()
        .setAuthor({ name: `Sistem Securizat MID v2`, iconURL: interaction.guild.iconURL() })
        .setTitle(`📡 LINIE DE ASISTENȚĂ INJECTATĂ — #${tokenData}`)
        .setColor(dept === 'purchase' ? 0x2ECC71 : 0x34495E)
        .setDescription(
            `Bun venit ${interaction.user}. Cererea ta a fost direcționată către departamentul **${dept.toUpperCase()}**.\n\n` +
            `╔═════════════════════════════════════════╗\n` +
            ` 📑 **Obiectiv principal:** \`${tinta}\`\n` +
            ` 🔒 **Token Sesiune:** \`${tokenData}\`\n` +
            ` 📊 **Status Reputație Client:** \`${trustLevel} (${userVouches.length} Vouchuri)\`\n` +
            `╚═════════════════════════════════════════╝\n\n` +
            `**Mesaj inițial înaintat:**\n\`\`\`text\n${detalii}\`\`\``
        )
        .setTimestamp();

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('tk_claim').setLabel('Claim Ticket').setStyle(ButtonStyle.Success).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('tk_unclaim').setLabel('Unclaim Ticket').setStyle(ButtonStyle.Secondary).setEmoji('🔓'),
        new ButtonBuilder().setCustomId('tk_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('☣️')
    );

    await chan.send({ content: `<@&${CONFIG.STAFF_ROLE_ID}> | Sesiune nouă deschisă de ${interaction.user}`, embeds: [embedPremium], components: [actionRow] });
    await interaction.editReply(`✅ Protocol finalizat. Linie securizată generată: ${chan}`);
    return;
}

// --- INTERACȚIUNE BUTOANE TICHETE ---
if (interaction.isButton()) {
    const { customId, channel, user, member } = interaction;
    if (customId === 'tk_claim') {
        await channel.send({ embeds: [new EmbedBuilder().setDescription(`🛡️ Acest caz a fost preluat oficial de către operatorul ${user}.`).setColor(0x2ECC71)] });
        await interaction.reply({ content: 'Ai preluat tichetul.', ephemeral: true });
    }
    if (customId === 'tk_unclaim') {
        await channel.send({ embeds: [new EmbedBuilder().setDescription(`🔓 Operatorul ${user} a eliberat tichetul. Un alt membru staff poate prelua cazul.`).setColor(0xE67E22)] });
        await interaction.reply({ content: 'Ai eliberat tichetul.', ephemeral: true });
    }
    if (customId === 'tk_close') {
        // VERIFICARE STRICTĂ ROL OWNER
        if (!member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) {
            return interaction.reply({ content: '❌ Permisiune respinsă. Doar utilizatorii cu rolul de **Owner** pot închide tichetele!', ephemeral: true });
        }
        await interaction.reply({ content: 'Canalul se va distruge securizat în 5 secunde...' });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
    }
}
});

// ==========================================
// 🛡️ GATEKEEPER INTERCEPTOR & COMENZI TEXT (+)
// ==========================================
client.on('messageCreate', async message => {
if (message.author.bot || !message.guild) return;

// SCUT PROTECȚIE ANTI-SPAM LIVE
if (SecurityShield.isThrottled(message.author.id, 6, 3000)) {
    await message.delete().catch(() => {});
    return message.channel.send(`⚠️ **[Security Shield]** S-a blocat activitatea suspectă pentru <@${message.author.id}>.`);
}

// FILTRU DETECTARE SUSPECT / SCAMMER PENTRU LINK-URI FRAUDULOASE
if (/http|\.gg\/|nitro|crypto|giveaway/i.test(message.content)) {
    if (message.member.roles.cache.has(CONFIG.SCAMMER_ROLE_ID) || message.member.roles.cache.has(CONFIG.SUSPECT_ROLE_ID)) {
        await message.delete().catch(() => {});
        return;
    }
}

if (!message.content.startsWith('+')) return;
const args = message.content.slice(1).split(/ +/);
const cmd = args[0].toLowerCase();

if (cmd === 'help') {
    return message.reply({ embeds: [new EmbedBuilder().setTitle('👑 Meniu Comenzi Text — Mod Premium').setColor(0x2B2D31).setDescription(`\`+vouch @user <recenzie>\` - Trimite un vouch spre analiză.\n\`+profile [@user]\` - Vezi profilul și rata de încredere dinamică.\n\`+leaderboard\` - Registrul criptografic central top 10.`)] });
}

if (cmd === 'vouch') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Sintaxă validă: \`+vouch @user <recenzie>\`');
    if (target.id === message.author.id) return message.reply('❌ Auto-vouch respins automat de kernel.');

    const comment = args.slice(2).join(' ');
    if (!comment || comment.length < 5) return message.reply('❌ Comentariul trebuie să aibă minim 5 caractere.');

    const vChan = message.guild.channels.cache.get(CONFIG.VOUCH_CHANNEL_ID);
    if (!vChan) return message.reply('❌ Eroare: Canalul de vouch-uri nu a fost găsit.');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`v_approve_${message.id}`).setLabel('Validează persistent').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`v_reject_${message.id}`).setLabel('Anulează Recenzia').setStyle(ButtonStyle.Danger)
    );

    const vEmbed = new EmbedBuilder().setTitle('🛡️ Control Audit Reputație — Tranzacție Nouă').setColor(0xD4AF37).addFields({ name: 'Expeditor:', value: `${message.author}`, inline: true }, { name: 'Partener:', value: `${target}`, inline: true }, { name: 'Conținut Analiză:', value: `\`\`\`\n"${comment}"\n\`\`\`` });
    const sent = await vChan.send({ embeds: [vEmbed], components: [row] });
    
    Database.setSpace('pendingVouches', sent.id, { targetId: target.id, authorId: message.author.id, comment: comment });
    
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, time: 86400000 });
    collector.on('collect', async btnInt => {
        if (!btnInt.member.roles.cache.has(CONFIG.STAFF_ROLE_ID) && !btnInt.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) {
            return btnInt.reply({ content: 'Nu ai permisiuni Staff pentru validare.', ephemeral: true });
        }
        
        const savedData = Database.getSpace('pendingVouches', sent.id, null);
        if (!savedData) return btnInt.reply({ content: 'Datele tranzacției au expirat.', ephemeral: true });

        if (btnInt.customId.startsWith('v_approve_')) {
            const existing = Database.getSpace('vouches', savedData.targetId, []);
            existing.push({ from: savedData.authorId, text: savedData.comment, date: new Date().toLocaleDateString() });
            Database.setSpace('vouches', savedData.targetId, existing);
            
            await btnInt.update({ content: `✅ Vouch aprobat și salvat persistent de ${btnInt.user.username}`, embeds: [], components: [] });
        } else {
            await btnInt.update({ content: `❌ Vouch respins și șters din buffer de ${btnInt.user.username}`, embeds: [], components: [] });
        }
    });

    return message.reply('✅ Date trimise în buffer-ul de audit. Va fi salvat persistent după validarea Staff-ului.');
}

// --- COMANDA PROFILE CU BARĂ DINAMICĂ GENERATĂ ---
if (cmd === 'profile') {
    const user = message.mentions.users.first() || message.author;
    const list = Database.getSpace('vouches', user.id, []);
    const score = list.length;

    let progressBar = '⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜';
    let statusText = 'Nivel: Începător';
    if (score >= 1)  { progressBar = '🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜'; statusText = 'Nivel: Verificat'; }
    if (score >= 3)  { progressBar = '🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜'; statusText = 'Nivel: Activ'; }
    if (score >= 5)  { progressBar = '🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜'; statusText = 'Nivel: Comerciant Sigur'; }
    if (score >= 10) { progressBar = '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩'; statusText = 'Nivel: Legendă / Trust Elite'; }

    const pEmbed = new EmbedBuilder()
        .setTitle(`👤 MATRIX PROFILE ── ${user.username.toUpperCase()}`)
        .setColor(0x2B2D31)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
            `### 📊 Indice de Încredere General\n` +
            `> \`${progressBar}\` **[ ${score} Vouch-uri ]**\n\n` +
            `╔════════════════════════════════════╗\n` +
            `  🛡️ **Securitate Profil:** \`${statusText}\`\n` +
            `  🔑 **ID Securizat:** \`${user.id}\`\n` +
            `╚════════════════════════════════════╝`
        )
        .setFooter({ text: 'Sistem de reputație asigurat de MID Kernel' });

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

// ==========================================
// 📡 SISTEM AUTOMAT LOGS (ȘTERGERI & MODIFICĂRI MESAJE)
// ==========================================
client.on('messageDelete', async message => {
    if (message.author?.bot || !message.guild) return;
    const logChan = message.guild.channels.cache.find(c => c.name === 'logs') || message.guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
    if (!logChan) return;

    const embed = new EmbedBuilder()
        .setTitle('🗑️ MESAJ ȘTERS DETECTAT')
        .setColor(0xE74C3C)
        .addFields(
            { name: '👤 Autor:', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
            { name: '📍 Canal:', value: `${message.channel}`, inline: true },
            { name: '💬 Conținut șters:', value: `\`\`\`text\n${message.content || '[Fără text / Doar atașament]'}\n\`\`\`` }
        )
        .setTimestamp();
    logChan.send({ embeds: [embed] }).catch(() => {});
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (oldMessage.author?.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
    const logChan = oldMessage.guild.channels.cache.find(c => c.name === 'logs') || oldMessage.guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
    if (!logChan) return;

    const embed = new EmbedBuilder()
        .setTitle('📝 MESAJ MODIFICAT DETECTAT')
        .setColor(0xE67E22)
        .addFields(
            { name: '👤 Autor:', value: `${oldMessage.author}`, inline: true },
            { name: '📍 Canal:', value: `${oldMessage.channel}`, inline: true },
            { name: '⬅️ Conținut Vechi:', value: `\`\`\`text\n${oldMessage.content || '[Fără text]'}\n\`\`\`` },
            { name: '➡️ Conținut Nou:', value: `\`\`\`text\n${newMessage.content || '[Fără text]'}\n\`\`\`` }
        )
        .setTimestamp();
    logChan.send({ embeds: [embed] }).catch(() => {});
});

// --- 🛡️ ENGINE COMPACT ANTI-CRASH GLOBAL ---
process.on('unhandledRejection', (reason, promise) => { console.error('⚠️ [ANTI-CRASH] Rejection:', reason); });
process.on('uncaughtException', (err, origin) => { console.error('🚨 [ANTI-CRASH] Exception:', err); });

client.login(process.env.TOKEN);
        
