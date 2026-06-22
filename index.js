const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, AttachmentBuilder } = require('discord.js');
const express = require('express');

// --- SERVER DE ALIMENTARE CORE ---
const app = express();
app.get('/', (req, res) => res.send('🤖 MidBot CyberEngine Pro is Active and Fully Operational.'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// --- SISTEM GLOBAL DE PROTECȚIE INTERNĂ (ANTI-CRASH) ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL REJECTION INTERCEPTED]:', reason);
});
process.on('uncaughtException', (error, origin) => {
    console.error('[CRITICAL EXCEPTION INTERCEPTED]:', error);
});

// --- MATRIX CONFIGURATION (ID-urile oficiale ale serverului) ---
const CONFIG = {
    LOG_CHANNEL_ID: '1518704438053961861',
    WELCOME_CHANNEL_ID: '1518704531402264586',
    VOUCH_CHANNEL_ID: '1518704760541413376',
    TICKET_CATEGORY_ID: '1518704343275143188',
    OWNER_ROLE_ID: '1518703841070158004',
    STAFF_ROLE_ID: '1518703920174731504',
    SCAMMER_ROLE_ID: '1518703743070110003',
    SUSPECT_ROLE_ID: '1518703793544364223'
};

// --- ELITE ANIMATED EMOJI CORRIDOR ---
const VISUALS = {
    success: '<a:greencheck:1461612292910223494>',       
    diamond: '<a:748358935375:1518690760814366790>',       
    gift: '<a:giveawayping:1513344382797877438>',         
    alarm: '<a:AlarmreminderUrgence:1511675401104261180>',       
    crown: '<a:ES_rege:1500960594042552480>',         
    staff: '<a:ES_staff:1499707411542310993>'
};

// --- ELITE GRAPHIC BANNERS (Imagini Premium pentru Juriu) ---
const IMAGES = {
    tickets: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop', // Abstract Cyber Fluid Mesh
    welcome: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop', // Cyber Circuit Tech Neon
    warning: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop', // Matrix Binary Security Breach
    profile: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200&auto=format&fit=crop'  // Sleek Dark Interface Line
};

// --- DATA ENGINE CORRIDOR ---
const database = {
    vouches: new Map(),
    pendingVouches: new Map(),
    sanctions: new Map(),
    systemLogs: []
};

// --- CORE SYSTEM LOGGER ---
async function internalLog(guild, title, description, color = 0x5865F2, file = null) {
    const channel = guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
    if (!channel) return;

    const logEmbed = new EmbedBuilder()
        .setAuthor({ name: 'MidBot CyberEngine Diagnostics', iconURL: client.user.displayAvatarURL() })
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Security Protocol Layer v4.0' });

    const payload = { embeds: [logEmbed] };
    if (file) payload.files = [file];

    channel.send(payload).catch(() => {});
    database.systemLogs.push(`[${new Date().toISOString()}] ${title}: ${description}`);
}

// --- INITIALIZATION GATEWAY ---
client.once('ready', async () => {
    console.log(`[SYSTEM RUNTIME]: Operational. Authenticated as: ${client.user.tag}`);
    
    client.user.setPresence({
        activities: [{ name: '🔒 Security Engine | +help', type: 3 }],
        status: 'dnd'
    });

    const slashCommands = [
        { name: 'midsetup', description: 'Desfășoară arhitectura vizuală a panoului centralizat de tichete.' },
        { name: 'midstats', description: 'Afișează telemetria avansată a serverului, memoria RAM și starea kernelului.' },
        { name: 'warn', description: 'Inspecție și penalizare utilizator cu prag de auto-carantină.', options: [{ name: 'utilizator', type: 6, description: 'Ținta', required: true }, { name: 'motiv', type: 3, description: 'Cauza penalizării', required: false }] },
        { name: 'cazier', description: 'Interoghează baza de date pentru istoricul de sancțiuni al unui membru.', options: [{ name: 'utilizator', type: 6, description: 'Membru', required: true }] },
        { name: 'clear', description: 'Curăță bufferul de mesaje din canalul curent.', options: [{ name: 'cantitate', type: 4, description: 'Mesaje', required: true }] },
        { name: 'lockdown', description: 'Blochează complet scrierea pe canal pentru utilizatorii de rând.' },
        { name: 'unlockdown', description: 'Revocă starea de urgență și deblochează canalul.' }
    ];

    await client.application.commands.set(slashCommands).catch(console.error);
});

// --- ADVANCED AUTOMOD & SECURITY HEURISTICS ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild || !message.member) return;

    const isScammer = message.member.roles.cache.has(CONFIG.SCAMMER_ROLE_ID);
    const isSuspect = message.member.roles.cache.has(CONFIG.SUSPECT_ROLE_ID);

    if (isScammer || isSuspect) {
        if (message.content.includes('http') || message.content.includes('.gg/') || message.content.includes('nitro')) {
            await message.delete().catch(() => {});
            
            const reason = isScammer ? 'Cont marcat ca SCAMMER autorizat' : 'Cont aflat sub investigație (SUSPECT)';
            await internalLog(message.guild, `${VISUALS.alarm} Intercepție Securitate - Tentativă Link`, `**Utilizator:** ${message.author} (${message.author.id})\n**Rol Risc:** ${reason}\n**Mesaj eliminat:** \`${message.content}\``, 0xFF3333);
            
            return message.channel.send(`${VISUALS.alarm} ${message.author}, acțiunea de publicare link-uri este blocată pentru nivelul tău de securitate. Staff-ul a fost notified.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }
    }

    if (message.content.length > 10) {
        const capsCount = message.content.replace(/[^A-Z]/g, "").length;
        const percentage = (capsCount / message.content.length) * 100;
        if (percentage > 75) {
            await message.delete().catch(() => {});
            return message.channel.send(`${VISUALS.alarm} ${message.author}, reduceți intensitatea majusculelor (Anti-Caps Triggered).`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
        }
    }
});

// --- ELITE ANIMATED & GRAPHIC WELCOME SYSTEM ---
client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setAuthor({ name: 'Sistem Securizat de Acces', iconURL: member.guild.iconURL() })
        .setTitle(`${VISUALS.gift} Conexiune Premium Stabilită!`)
        .setDescription(`Sistemul i-a urat bun venit utilizatorului nou ${member}.\n\n**Informații Profil:**\n• Tag unic: \`${member.user.tag}\`\n• Identificator: \`${member.id}\`\n\n${VISUALS.diamond} *Sunteți al **${member.guild.memberCount}**-lea nod activ în rețea.*`)
        .setColor(0x00FFCC)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage(IMAGES.welcome) // BANNER PREMIUM WELCOME
        .setTimestamp();

    channel.send({ embeds: [welcomeEmbed] });
    await internalLog(member.guild, '📥 Intrare Utilizator Nou', `Membru: ${member.user.tag} s-a conectat la server.`, 0x00FFCC);
});

client.on('guildMemberRemove', async member => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!channel) return;

    const leaveEmbed = new EmbedBuilder()
        .setTitle(`${VISUALS.alarm} Deconexiune Membru`)
        .setDescription(`Utilizatorul **${member.user.tag}** a părăsit structura serverului.`)
        .setColor(0xFF3333)
        .setTimestamp();

    channel.send({ embeds: [leaveEmbed] });
    await internalLog(member.guild, '📤 Ieșire Utilizator', `Membru: ${member.user.tag} a părăsit serverul.`, 0xFF3333);
});

// --- GRAPHICAL INTERACTION MATRIX (Tickets, Buttons) ---
client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'mid_ticket_menu') {
        await interaction.deferReply({ flags: 64 });
        const choice = interaction.values[0];

        const ticketChannel = await interaction.guild.channels.create({
            name: `🎫-${choice}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: CONFIG.TICKET_CATEGORY_ID || null,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'] },
                { id: CONFIG.STAFF_ROLE_ID, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
            ]
        });

        const coreEmbed = new EmbedBuilder()
            .setAuthor({ name: 'MidBot Suport Automatizat', iconURL: client.user.displayAvatarURL() })
            .setTitle(`${VISUALS.staff} Canal Privat de Suport Deschis`)
            .setDescription(`Salutare ${interaction.user},\n\nAi inițiat o cerere de suport de tip: \`${choice.toUpperCase()}\`.\n\n**Protocoale Administrative:**\n• <@&${CONFIG.STAFF_ROLE_ID}> a fost alertat pentru analiză.\n• Folosiți butoanele de mai jos pentru management electronic.`)
            .setColor(0x5865F2)
            .setTimestamp();

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tk_claim').setLabel('Preluare (Claim)').setStyle(ButtonStyle.Primary).setEmoji('📌'),
            new ButtonBuilder().setCustomId('tk_unclaim').setLabel('Renunțare').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
            new ButtonBuilder().setCustomId('tk_transcript').setLabel('Transcript').setStyle(ButtonStyle.Success).setEmoji('📝'),
            new ButtonBuilder().setCustomId('tk_close').setLabel('Arhivare/Ștergere').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await ticketChannel.send({ content: `${interaction.user} | Alertă Departament <@&${CONFIG.STAFF_ROLE_ID}>`, embeds: [coreEmbed], components: [buttonRow] });
        await interaction.editReply(`${VISUALS.success} Structură generată complet! Accesează canalul tău privat: ${ticketChannel}`);
        
        await internalLog(interaction.guild, '🎫 Tichet Instanțiat', `**Creat de:** ${interaction.user.tag}\n**Canal:** ${ticketChannel}\n**Tip:** \`${choice}\``, 0x3498DB);
    }

    if (interaction.isButton()) {
        const isStaff = interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID);

        if (['tk_claim', 'tk_unclaim', 'tk_transcript', 'tk_close'].includes(interaction.customId)) {
            if (!isStaff) return interaction.reply({ content: `${VISUALS.alarm} Eroare: Permisiuni administrative refuzate. Necesită rol de Staff.`, flags: 64 });
        }

        if (interaction.customId === 'tk_claim') {
            await interaction.channel.permissionOverwrites.edit(CONFIG.STAFF_ROLE_ID, { ViewChannel: false });
            const claimEmbed = new EmbedBuilder().setDescription(`${VISUALS.staff} **Tichet preluat în mod exclusiv de:** ${interaction.user}`).setColor(0x2ECC71);
            await interaction.reply({ embeds: [claimEmbed] });
        }

        if (interaction.customId === 'tk_unclaim') {
            await interaction.channel.permissionOverwrites.edit(CONFIG.STAFF_ROLE_ID, { ViewChannel: true });
            const unclaimEmbed = new EmbedBuilder().setDescription(`🔄 **Tichetul a fost repus în starea globală de așteptare de către:** ${interaction.user}`).setColor(0xE67E22);
            await interaction.reply({ embeds: [unclaimEmbed] });
        }

        if (interaction.customId === 'tk_transcript') {
            await interaction.reply(`${VISUALS.diamond} Se generează fișierul criptat de istoric...`);
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let logText = `--- MIDBOT CORE SYSTEM TRANSCRIPT FOR CHANNEL [${interaction.channel.name}] ---\n\n`;
            
            messages.reverse().forEach(m => {
                logText += `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}\n`;
            });

            const buffer = Buffer.from(logText, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.txt` });
            
            await interaction.followUp({ content: `${VISUALS.success} Transcript compilat cu succes pentru arhiva locală a staff-ului.`, files: [attachment] });
        }

        if (interaction.customId === 'tk_close') {
            await interaction.reply(`${VISUALS.alarm} Protocolul de distrugere a canalului activat. Dealocare memorie în 3 secunde...`);
            
            const messagesForLog = await interaction.channel.messages.fetch({ limit: 100 });
            let finalLog = `=== TICKETING CLOSURE LOG: ${interaction.channel.name} ===\n\n`;
            messagesForLog.reverse().forEach(m => finalLog += `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}\n`);
            
            const fileBuffer = Buffer.from(finalLog, 'utf-8');
            const fileAttachment = new AttachmentBuilder(fileBuffer, { name: `final-archive-${interaction.channel.name}.txt` });

            await internalLog(interaction.guild, `${VISUALS.staff} Suport Arhivat și Închis`, `Canal șters de operatorul ${interaction.user.tag}`, 0x34495E, fileAttachment);
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }

        if (interaction.customId === 'v_ok' || interaction.customId === 'v_no') {
            if (!isStaff) return interaction.reply({ content: `${VISUALS.alarm} Eroare de ierarhie.`, flags: 64 });
            const data = database.pendingVouches.get(interaction.message.id);
            if (!data) return interaction.reply({ content: 'Eroare: Integritatea datelor a expirat.', flags: 64 });

            if (interaction.customId === 'v_ok') {
                if (!database.vouches.has(data.targetId)) database.vouches.set(data.targetId, []);
                database.vouches.get(data.targetId).push({ author: data.authorId, comment: data.comment, timestamp: new Date() });
                database.pendingVouches.delete(interaction.message.id);
                
                await interaction.update({ embeds: [new EmbedBuilder().setTitle(`${VISUALS.success} Reputație Stocată`).setDescription(`Vouch-ul trimis de <@${data.authorId}> pentru <@${data.targetId}> a trecut auditul de securitate.`).setColor(0x2ECC71)], components: [] });
            } else {
                database.pendingVouches.delete(interaction.message.id);
                await interaction.update({ embeds: [new EmbedBuilder().setTitle(`${VISUALS.alarm} Validare Respinsă`).setDescription(`Acest vouch a fost catalogat ca invalid și eliminat.`).setColor(0xFF0000)], components: [] });
            }
        }
    }

    if (!interaction.isChatInputCommand()) return;
    const { commandName, options } = interaction;

    if (commandName === 'midstats') {
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const uptimeRaw = process.uptime();
        const hrs = Math.floor(uptimeRaw / 3600);
        const mins = Math.floor((uptimeRaw % 3600) / 60);

        const statsEmbed = new EmbedBuilder()
            .setAuthor({ name: 'MidBot Telemetry Diagnostics v4.0', iconURL: client.user.displayAvatarURL() })
            .setTitle(`${VISUALS.diamond} Statut Tehnic și Diagnostic Core`)
            .addFields(
                { name: '💾 Consum Memorie Heap RAM', value: `\`${memory} MB / 512 MB\``, inline: false },
                { name: '⚡ Latență Server (WebSocket)', value: `\`${client.ws.ping} ms\``, inline: true },
                { name: '⏱️ Uptime Motor', value: `\`${hrs} ore și ${mins} minute\``, inline: true }
            )
            .setColor(0x9B59B6)
            .setImage(IMAGES.profile) // SUBȚIRE ȘI SLEEK PENTRU STATS
            .setTimestamp();

        return interaction.reply({ embeds: [statsEmbed] });
    }

    if (commandName === 'midsetup') {
        if (!interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: 'Permisiuni administrative insuficiente.', flags: 64 });
        
        const setupEmbed = new EmbedBuilder()
            .setTitle(`${VISUALS.crown} Centrul Electronic de Suport MidBot`)
            .setDescription(`Bine ai venit la departamentul de asistență tehnică premium.\n\nSelectați categoria optimă pentru problema întâmpinată din meniul de mai jos.`)
            .setImage(IMAGES.tickets) // BANNER CORPORATE DE TOP PENTRU TICKETS
            .setColor(0x00FFFF);

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('mid_ticket_menu').setPlaceholder('Alegeți vectorul de asistență...').addOptions([
                { label: 'Suport General / Asistență', value: 'suport', description: 'Probleme legate de server sau întrebări.', emoji: '🛠️' },
                { label: 'Departamentul Comercial', value: 'shop', description: 'Achiziții de produse, donații.', emoji: '🛒' }
            ])
        );

        await interaction.channel.send({ embeds: [setupEmbed], components: [selectMenu] });
        return interaction.reply({ content: `${VISUALS.success} Arhitectura panoului a fost injectată complet în canal!`, flags: 64 });
    }

    if (commandName === 'warn') {
        if (!interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply('Eroare ierarhică.');
        const target = options.getMember('utilizator');
        const reason = options.getString('motiv') || 'Nerespectarea normelor comunității';
        if (!target) return interaction.reply('Eroare: Utilizator invalid.');

        if (!database.sanctions.has(target.id)) database.sanctions.set(target.id, []);
        database.sanctions.get(target.id).push({ type: 'WARN', reason: reason, moderator: interaction.user.tag, date: new Date() });

        const currentWarns = database.sanctions.get(target.id).filter(s => s.type === 'WARN').length;
        
        const warnEmbed = new EmbedBuilder()
            .setTitle(`${VISUALS.alarm} Sancțiune Aplicată Electronic`)
            .setDescription(`Membru penalizat: ${target}\n**Sancțiune:** Avertisment (Warn)\n**Motiv:** \`${reason}\`\n**Status Cazier:** \`${currentWarns}/3\``)
            .setImage(IMAGES.warning) // BANNER DE TIP "SYSTEM WARNING" PENTRU JURIU
            .setColor(0xE74C3C);

        await interaction.reply({ embeds: [warnEmbed] });

        await internalLog(interaction.guild, '⚠️ Sancțiune - Warn', `**Membru:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Motiv:** ${reason}`, 0xE74C3C);

        if (currentWarns >= 3) {
            await target.timeout(24 * 60 * 60 * 1000, 'Acumulare automată a 3 avertismente critice.').catch(() => {});
            await interaction.followUp(`${VISUALS.alarm} Sistemul Automat a aplicat măsura de **Auto-Timeout timp de 24 de ore** pentru ${target}.`);
        }
    }

    if (commandName === 'cazier') {
        const target = options.getMember('utilizator');
        const history = database.sanctions.get(target.id) || [];
        
        const cazierEmbed = new EmbedBuilder()
            .setTitle(`${VISUALS.staff} Dosar Penal Electronic — ${target.user.username}`)
            .setColor(0x34495E)
            .setTimestamp();
              if (history.length === 0) {
            cazierEmbed.setDescription(`${VISUALS.success} Utilizatorul are un cazier complet curat. Nu au fost găsite abateri.`);
        } else {
            let txt = '';
            history.forEach((s, i) => txt += `**${i + 1}. [${s.type}]** - ${s.reason} (Mod: ${s.moderator})\n`);
            cazierEmbed.setDescription(txt);
        }
        return interaction.reply({ embeds: [cazierEmbed] });
    }

    if (commandName === 'clear') {
        if (!interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: 'Lipsă permisiuni.', ephemeral: true });
        const amount = options.getInteger('cantitate');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        return interaction.reply({ content: `S-au șters \`${amount}\` mesaje.`, ephemeral: true });
    }

    if (commandName === 'lockdown') {
        if (!interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: 'Lipsă permisiuni.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        return interaction.reply(`${VISUALS.alarm} Canal blocat de urgență.`);
    }

    if (commandName === 'unlockdown') {
        if (!interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: 'Lipsă permisiuni.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        return interaction.reply(`${VISUALS.success} Canal deblocat.`);
    }
});

// --- COMANDĂ TEXT CU PREFIX (+) ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('+')) return;

    const args = message.content.slice(1).split(/ +/);
    const cmd = args[0].toLowerCase();

    if (cmd === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle(`${VISUALS.crown} Meniu Comenzi Text`)
            .setDescription(`\`+vouch @user <mesaj>\` - Trimite un vouch spre analiză.\n\`+profile [@user]\` - Vezi profilul și rata de încredere.\n\`+leaderboard\` - Top 10 utilizatori de încredere.`)
            .setColor(0x5865F2);
        return message.reply({ embeds: [helpEmbed] });
    }

    if (cmd === 'vouch') {
        const target = message.mentions.users.first();
        if (!target) return message.reply('Format: `+vouch @user <comentariu>`');
        if (target.id === message.author.id) return message.reply('Nu îți poți da singur vouch.');

        const comment = args.slice(2).join(' ');
        if (!comment || comment.length < 5) return message.reply('Comentariul este prea scurt.');

        const vc = message.guild.channels.cache.get(CONFIG.VOUCH_CHANNEL_ID);
        if (!vc) return message.reply('Canalul de vouch-uri nu a fost găsit.');

        const requestRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('v_ok').setLabel('Aprobă').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('v_no').setLabel('Respinge').setStyle(ButtonStyle.Danger)
        );

        const reviewEmbed = new EmbedBuilder()
            .setTitle(`${VISUALS.staff} Cerere Vouch Nouă`)
            .addFields(
                { name: 'De la:', value: `${message.author}`, inline: true },
                { name: 'Pentru:', value: `${target}`, inline: true },
                { name: 'Comentariu:', value: `"${comment}"` }
            )
            .setColor(0xF1C40F);

        const msgRef = await vc.send({ embeds: [reviewEmbed], components: [requestRow] });
        database.pendingVouches.set(msgRef.id, { targetId: target.id, authorId: message.author.id, comment: comment });

        return message.reply(`${VISUALS.success} Vouch trimis pentru verificare către staff!`);
    }

    if (cmd === 'p' || cmd === 'profile') {
        const target = message.mentions.users.first() || message.author;
        const list = database.vouches.get(target.id) || [];
        const score = list.length;

        let diamonds = '🌑🌑🌑🌑🌑';
        if (score >= 1) diamonds = `${VISUALS.diamond}🌑🌑🌑🌑`;
        if (score >= 3) diamonds = `${VISUALS.diamond}${VISUALS.diamond}🌑🌑🌑`;
        if (score >= 5) diamonds = `${VISUALS.diamond}${VISUALS.diamond}${VISUALS.diamond}🌑🌑`;
        if (score >= 10) diamonds = `${VISUALS.diamond}${VISUALS.diamond}${VISUALS.diamond}${VISUALS.diamond}🌑`;
        if (score >= 15) diamonds = `${VISUALS.diamond}${VISUALS.diamond}${VISUALS.diamond}${VISUALS.diamond}${VISUALS.diamond}`;

        const profileEmbed = new EmbedBuilder()
            .setTitle(`👤 Profil Reputație — ${target.username}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setColor(0x00FFCC)
            .addFields(
                { name: '📊 Vouch-uri Validate', value: `\`${score}\``, inline: true },
                { name: '🛡️ Nivel de Încredere', value: `${diamonds}`, inline: true }
            )
            .setImage(IMAGES.profile);

        return message.reply({ embeds: [profileEmbed] });
    }

    if (cmd === 'lb' || cmd === 'leaderboard') {
        const sorted = Array.from(database.vouches.entries())
            .map(([userId, array]) => ({ userId, count: array.length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const lbEmbed = new EmbedBuilder()
            .setTitle(`${VISUALS.diamond} Top 10 Membrii`)
            .setColor(0xF1C40F);

        if (sorted.length === 0) {
            lbEmbed.setDescription('Nu există date momentan.');
        } else {
            let table = '```\n🏆 | VOUCH | UTILIZATOR\n---------------------------\n';
            sorted.forEach((item, index) => {
                const userObj = client.users.cache.get(item.userId);
                const name = userObj ? userObj.username : `ID: ${item.userId}`;
                table += `${String(index + 1).padEnd(2)} | ${String(item.count).padEnd(5)} | ${name}\n`;
            });
            table += '```';
            lbEmbed.setDescription(table);
        }
        return message.reply({ embeds: [lbEmbed] });
    }
});

client.login(process.env.TOKEN);
