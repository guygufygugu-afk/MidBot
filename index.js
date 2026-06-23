const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ChannelType, 
    ComponentType 
} = require('discord.js');
const fs = require('fs');

// ==========================================
// ⚙️ CONFIGURARE ID-URI SERVER (MODIFICĂ AICI)
// ==========================================
const CONFIG = {
    STAFF_ROLE_ID: '123456789012345678',   // Pune ID-ul rolului de Staff
    OWNER_ROLE_ID: '123456789012345678',   // Pune ID-ul rolului de Owner
    TICKET_CATEGORY_ID: '123456789012345678', // Pune ID-ul categoriei unde se deschid tichetele
    VOUCH_CHANNEL_ID: '123456789012345678',   // Pune ID-ul canalului de vouch-review
    LOG_CHANNEL_ID: '123456789012345678',     // Pune ID-ul canalului de logs
    SCAMMER_ROLE_ID: '123456789012345678', // Pune ID-ul rolului de Scammer (dacă ai)
    SUSPECT_ROLE_ID: '123456789012345678'   // Pune ID-ul rolului de Suspect (dacă ai)
};

// ==========================================
// 🛠️ UTILITARE INTEGRATE (BAZĂ DE DATE & SCUT)
// ==========================================
const Database = {
    dbFile: './database.json',
    data: {},
    init() {
        if (fs.existsSync(this.dbFile)) {
            try { this.data = JSON.parse(fs.readFileSync(this.dbFile, 'utf8')); } catch (e) { this.data = {}; }
        } else { this.data = {}; this.save(); }
    },
    save() { fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2)); },
    getSpace(space, key, defaultValue) {
        this.init();
        if (!this.data[space]) this.data[space] = {};
        return this.data[space][key] !== undefined ? this.data[space][key] : defaultValue;
    },
    setSpace(space, key, value) {
        this.init();
        if (!this.data[space]) this.data[space] = {};
        this.data[space][key] = value;
        this.save();
    },
    getAll(space) { this.init(); return this.data[space] || {}; }
};

const antiSpamMap = new Map();
const SecurityShield = {
    isThrottled(userId, limit, timeWindow) {
        const now = Date.now();
        if (!antiSpamMap.has(userId)) antiSpamMap.set(userId, []);
        const timestamps = antiSpamMap.get(userId);
        const validTimestamps = timestamps.filter(ts => now - ts < timeWindow);
        validTimestamps.push(now);
        antiSpamMap.set(userId, validTimestamps);
        return validTimestamps.length > limit;
    }
};

// ==========================================
// 🤖 INIȚIALIZARE CLIENT ȘI INTENTS
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// 🚀 EVENIMENT PORNIRE & SINCRONIZARE
// ==========================================
client.once('ready', async () => {
    console.log(`📡 Kernel activat. MID v2 este online ca: ${client.user.tag}`);

    const cleanCommands = [
        { name: 'clear', description: 'Șterge un număr de mesaje de pe canal.', options: [{ name: 'cantitate', description: 'Numărul de mesaje', type: 4, required: true }] },
        { name: 'lockdown', description: 'Blochează complet trimiterea de mesaje pe acest canal.' },
        { name: 'unlockdown', description: 'Restabilește permisiunile de scriere pe canal.' },
        { name: 'ban', description: 'Interzice accesul unui utilizator pe server.', options: [{ name: 'user', description: 'Utilizatorul vizat', type: 6, required: true }, { name: 'motiv', description: 'Motivul sau justificarea', type: 3, required: false }] },
        { name: 'unban', description: 'Revocă banul unui utilizator folosind ID-ul.', options: [{ name: 'id', description: 'ID-ul contului', type: 3, required: true }] },
        { name: 'timeout', description: 'Izolează temporar un utilizator (Mute).', options: [{ name: 'user', description: 'Utilizatorul vizat', type: 6, required: true }, { name: 'minute', description: 'Durata în minute', type: 4, required: true }] },
        { name: 'untimeout', description: 'Elimină izolarea temporală a unui utilizator.', options: [{ name: 'user', description: 'Utilizatorul vizat', type: 6, required: true }] },
        { name: 'warn', description: 'Aplica un avertisment formal unui membru.', options: [{ name: 'user', description: 'Utilizatorul vizat', type: 6, required: true }, { name: 'motiv', description: 'Motivul avertismentului', type: 3, required: true }] },
        { name: 'setup_panel', description: 'Generează panoul central MID AUTOMATION HUB v2.' }
    ];

    await client.application.commands.set(cleanCommands);
    console.log('✅ Sincronizare finalizată. Comenzile fantomă au fost distruse din baza Discord.');
});

// ==========================================
// 🎛️ PROCESARE COMENZI SLASH & MODERARE
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, member } = interaction;
    const isStaff = member.roles.cache.has(CONFIG.STAFF_ROLE_ID) || member.roles.cache.has(CONFIG.OWNER_ROLE_ID);

    if (commandName === 'setup_panel') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        
        const embed = new EmbedBuilder()
            .setTitle('MID AUTOMATION HUB v2')
            .setDescription(
                `Alege din meniul de mai jos tipul de asistență sau interacțiune de care ai nevoie.\n\n` +
                `🛡️ **Asistență Tehnică / Support**\nPentru probleme legate de server sau asistență generală.\n\n` +
                `💳 **Purchase**\nDeschide o sesiune securizată direct cu managerii comerciali.\n\n` +
                `🗃️ **Recrutare Support Team**\nDepune dosarul tău digital pentru o funcție în Staff.`
            )
            .setColor(0x2B2D31)
            .setFooter({ text: 'Sistem automatizat • Timp de răspuns estimat: < 5 minute' });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('mid_ticket_menu')
            .setPlaceholder('Alege tipul de interacțiune dorit...')
            .addOptions([
                { label: 'Asistență Generală', description: 'Deschide un tichet de suport tehnic.', value: 'support', emoji: '🛡️' },
                { label: 'Achiziții / Purchase', description: 'Discută cu un manager comercial.', value: 'purchase', emoji: '💳' },
                { label: 'Aplică în Staff', description: 'Depune formularul de recrutare.', value: 'aplicatie', emoji: '🗃️' }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: 'Panoul MID v2 a fost generat cu succes.', ephemeral: true });
    }

    if (commandName === 'clear') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const amount = options.getInteger('cantitate');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        return interaction.reply({ content: `✅ Ștergere asincronă finalizată pentru \`${amount}\` mesaje.`, ephemeral: true });
    }

    if (commandName === 'lockdown') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('🔒 **Protocol Lockdown activat.** Canal izolat cu succes.').setColor(0xE74C3C)] });
    }

    if (commandName === 'unlockdown') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('🔓 **Protocol Lockdown dezactivat.** Permisiuni restabilite.').setColor(0x2ECC71)] });
    }

    if (commandName === 'ban') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const target = options.getUser('user');
        const reason = options.getString('motiv') || 'Nespecificat';
        await guild.members.ban(target, { reason }).catch(() => {});
        return interaction.reply({ content: `🚨 ${target.username} a primit ban persistent. Motiv: \`${reason}\`` });
    }

    if (commandName === 'unban') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const id = options.getString('id');
        await guild.members.unban(id).catch(() => {});
        return interaction.reply({ content: `✅ Utilizatorul cu ID-ul \`${id}\` a fost debanat.` });
    }

    if (commandName === 'timeout') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const targetUser = options.getUser('user');
        const minutes = options.getInteger('minute');
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => {});
        if (!targetMember) return interaction.reply({ content: 'Utilizatorul nu este pe server.', ephemeral: true });
        await targetMember.timeout(minutes * 60 * 1000).catch(() => {});
        return interaction.reply({ content: `⏳ ${targetUser.username} a fost izolat pentru \`${minutes}\` minute.` });
    }

    if (commandName === 'untimeout') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const targetUser = options.getUser('user');
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => {});
        if (!targetMember) return interaction.reply({ content: 'Utilizatorul nu este pe server.', ephemeral: true });
        await targetMember.timeout(null).catch(() => {});
        return interaction.reply({ content: `🔊 S-a eliminat izolarea pentru ${targetUser.username}.` });
    }

    if (commandName === 'warn') {
        if (!isStaff) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', ephemeral: true });
        const target = options.getUser('user');
        const reason = options.getString('motiv');
        return interaction.reply({ content: `⚠️ Avertisment înregistrat pentru ${target}. Motiv: \`${reason}\`` });
    }
});

// ==========================================
// 🎫 MANAGEMENT MATRIX INTERACȚIUNI TICHETE
// ==========================================
client.on('interactionCreate', async interaction => {
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

    if (interaction.isModalSubmit() && interaction.customId.startsWith('md_staff_')) {
        await interaction.deferReply({ ephemeral: true });
        const token = interaction.customId.split('_')[2];
        const varsta = interaction.fields.getTextInputValue('st_varsta');
        const ore = interaction.fields.getTextInputValue('st_ore');
        const exp = interaction.fields.getTextInputValue('st_exp');

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

    if (interaction.isModalSubmit() && interaction.customId.startsWith('md_cyber_')) {
        await interaction.deferReply({ ephemeral: true });
        const parts = interaction.customId.split('_');
        const dept = parts[2];
        const tokenData = parts[3];
        const tinta = interaction.fields.getTextInputValue('f_tinta');
        const detalii = interaction.fields.getTextInputValue('f_detalii');

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
        return interaction.editReply(`✅ Protocol finalizat. Linie securizată generată: ${chan}`);
    }

    if (interaction.isButton()) {
        const { customId, channel, user, member } = interaction;
        if (customId === 'tk_claim') {
            await channel.send({ embeds: [new EmbedBuilder().setDescription(`🛡️ Acest caz a fost preluat oficial de către operatorul ${user}.`).setColor(0x2ECC71)] });
            return interaction.reply({ content: 'Ai preluat tichetul.', ephemeral: true });
        }
        if (customId === 'tk_unclaim') {
            await channel.send({ embeds: [new EmbedBuilder().setDescription(`🔓 Operatorul ${user} a eliberat tichetul. Un alt membru staff poate prelua cazul.`).setColor(0xE67E22)] });
            return interaction.reply({ content: 'Ai eliberat tichetul.', ephemeral: true });
        }
        if (customId === 'tk_close') {
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

    // SCUT ANTISPAM OPTIMIZAT
    if (SecurityShield.isThrottled(message.author.id, 6, 3000)) {
        try { await message.delete(); } catch(e){}
        return message.channel.send(`⚠️ **[Security Shield]** S-a blocat activitatea suspectă pentru <@${message.author.id}>.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    // FILTRU ANTISCAM LINKURI
    if (/http|\.gg\/|nitro|crypto|giveaway/i.test(message.content)) {
        if (message.member && (message.member.roles.cache.has(CONFIG.SCAMMER_ROLE_ID) || message.member.roles.cache.has(CONFIG.SUSPECT_ROLE_ID))) {
            try { await message.delete(); } catch(e){}
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
// 📡 SISTEM AUTOMAT LOGS (ȘTERGERI & MODIFICĂRI)
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
        
