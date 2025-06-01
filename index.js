const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const prefix = '.';
let links = [];
const linksFile = './links.json';
if (fs.existsSync(linksFile)) {
    links = JSON.parse(fs.readFileSync(linksFile));
}

const CEZALI_ROL_ADI = "Cezalı";
const GUVENLI_YAS_GUN = 7;
const reklamKelimeleri = ['discord.gg', 'http', '.com', '.net', '.org'];

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const member = message.member;

    if (reklamKelimeleri.some(kelime => message.content.toLowerCase().includes(kelime))) {
        await message.delete().catch(() => {});
        return message.channel.send(`🚫 ${member}, reklam yapamazsın!`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    }

    const buyukHarfOrani = (message.content.replace(/[^A-Z]/g, "").length / message.content.length);
    if (message.content.length > 5 && buyukHarfOrani > 0.7) {
        await message.delete().catch(() => {});
        return message.channel.send(`🔇 ${member}, lütfen mesajlarını küçük harflerle yaz!`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    }

    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'link' && args[0] === 'ekle') {
        const link = args[1];
        if (!link || !link.startsWith('http')) return message.channel.send('❌ Geçerli bir link gir.');
        if (links.includes(link)) return message.channel.send('⚠️ Bu link zaten eklenmiş.');
        links.push(link);
        fs.writeFileSync(linksFile, JSON.stringify(links));
        message.channel.send(`✅ Link eklendi: ${link}`);
    }

    if (command === 'link' && args[0] === 'sil') {
        const link = args[1];
        if (!links.includes(link)) return message.channel.send('❌ Bu link bulunamadı.');
        links = links.filter(l => l !== link);
        fs.writeFileSync(linksFile, JSON.stringify(links));
        message.channel.send(`🗑️ Link silindi: ${link}`);
    }

    if (command === 'uptime') {
        if (links.length === 0) return message.channel.send('📭 Hiç link eklenmemiş.');
        message.channel.send(`🔗 Takip edilen linkler:\n` + links.join('\n'));
    }

    // Ekstra komutlar
    if (command === 'ping') {
        return message.channel.send(`🏓 Gecikme: ${client.ws.ping}ms`);
    }

    if (command === 'sunucu') {
        return message.channel.send(`📊 Sunucu adı: ${message.guild.name}\n👥 Üye sayısı: ${message.guild.memberCount}`);
    }

    if (command === 'avatar') {
        const user = message.mentions.users.first() || message.author;
        return message.channel.send({ content: user.displayAvatarURL({ dynamic: true, size: 1024 }) });
    }

    if (command === 'rolver') {
        if (!message.member.permissions.has('ManageRoles')) return message.reply('❌ Rol vermek için yetkin yok!');
        const user = message.mentions.members.first();
        const roleName = args.slice(1).join(" ");
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (user && role) {
            user.roles.add(role).then(() => {
                message.channel.send(`✅ ${user} kullanıcısına ${role.name} rolü verildi.`);
            }).catch(() => message.channel.send('❌ Rol verilemedi.'));
        }
    }

    if (command === 'rolal') {
        if (!message.member.permissions.has('ManageRoles')) return message.reply('❌ Rol almak için yetkin yok!');
        const user = message.mentions.members.first();
        const roleName = args.slice(1).join(" ");
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (user && role) {
            user.roles.remove(role).then(() => {
                message.channel.send(`✅ ${user} kullanıcısından ${role.name} rolü alındı.`);
            }).catch(() => message.channel.send('❌ Rol alınamadı.'));
        }
    }

    if (command === 'temizle') {
        if (!message.member.permissions.has('ManageMessages')) return message.reply('❌ Mesaj silebilmek için yetkin yok!');
        const miktar = parseInt(args[0]);
        if (!miktar || miktar < 1 || miktar > 100) return message.reply('1-100 arasında bir sayı gir!');
        message.channel.bulkDelete(miktar, true).then(() => {
            message.channel.send(`🧹 ${miktar} mesaj silindi.`).then(msg => setTimeout(() => msg.delete(), 3000));
        });
    }

    if (command === 'kick') {
        if (!message.member.permissions.has('KickMembers')) return message.reply('❌ Kick yetkin yok!');
        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Kick atılacak kullanıcıyı etiketle!');
        user.kick().then(() => {
            message.channel.send(`👢 ${user} sunucudan atıldı.`);
        }).catch(() => message.channel.send('❌ Kick işlemi başarısız.'));
    }

    if (command === 'ban') {
        if (!message.member.permissions.has('BanMembers')) return message.reply('❌ Ban yetkin yok!');
        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Banlanacak kullanıcıyı etiketle!');
        user.ban().then(() => {
            message.channel.send(`⛔ ${user} sunucudan yasaklandı.`);
        }).catch(() => message.channel.send('❌ Ban işlemi başarısız.'));
    }

    if (command === 'uyar') {
        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Uyarılacak kullanıcıyı etiketle!');
        message.channel.send(`⚠️ ${user}, yetkililer tarafından uyarıldın. Lütfen kurallara dikkat et.`);
    }

    if (command === 'yardım') {
        const helpText = \`
📜 **Komutlar Listesi**
.ping - Botun gecikmesini gösterir
.sunucu - Sunucu bilgilerini gösterir
.avatar [@kişi] - Avatarı gösterir
.rolver @kişi RolAdı - Rol verir
.rolal @kişi RolAdı - Rol alır
.temizle <sayı> - Mesaj temizler (1-100)
.kick @kişi - Sunucudan atar
.ban @kişi - Banlar
.uyar @kişi - Kullanıcıyı uyarır
.link ekle <link> - Link uptime'a ekler
.link sil <link> - Link siler
.uptime - Linkleri listeler
\`;
        message.channel.send(helpText);
    }
});

// Yeni kullanıcılara cezalı rolü ver
client.on('guildMemberAdd', async member => {
    const accountAgeMs = Date.now() - member.user.createdAt.getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
    if (accountAgeDays < GUVENLI_YAS_GUN) {
        const role = member.guild.roles.cache.find(r => r.name === CEZALI_ROL_ADI);
        if (role) {
            await member.roles.add(role).catch(() => {});
        }
    }
});

// Linkleri uptime et
setInterval(() => {
    links.forEach(link => {
        axios.get(link).catch(err => {});
    });
}, 5 * 60 * 1000);

client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.login('BOT_TOKEN'); // Buraya kendi tokenını gir
