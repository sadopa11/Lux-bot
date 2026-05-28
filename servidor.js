const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const app = express();

// Configurações
const CLIENT_ID = '1504203077308252294';
// IMPORTANTE: No Render, vá em Environment e adicione uma variável chamada CLIENT_SECRET
// com o valor abaixo para não deixar exposto aqui.
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'iN54Sl9YylyRzk4hXJvK7HWBSImE6-BI';
const REDIRECT_URI = 'https://lux-bot-c6fm.onrender.com/callback';

// Porta dinâmica para o Render
const PORT = process.env.PORT || 10000;

// Configurações do EJS e Static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());

// Configuração da Sessão
app.use(session({
    secret: 'chave-secreta-lux-bot',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Rota Inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de API
app.get('/api/stats', (req, res) => {
    res.json({ users: 999, apostas: 888, ativas: 777, tickets: 666 });
});

// Rota do Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    
    res.render('painel', {
        userName: req.session.user.username,
        userAvatar: req.session.user.avatar,
        guilds: req.session.guilds || [],
        userPlan: "Sem Plano"
    });
});

// Rota de Callback
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/');

    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }));

        const token = tokenRes.data.access_token;
        const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` }});
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` }});

        const idsOndeMeuBotEsta = ['1503566673637019650']; 
        const guildsFiltradas = guildsRes.data.filter(g => idsOndeMeuBotEsta.includes(g.id));

        req.session.user = {
            username: userRes.data.username,
            avatar: `https://cdn.discordapp.com/avatars/${userRes.data.id}/${userRes.data.avatar}.png`
        };
        req.session.guilds = guildsFiltradas; 

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.send('Erro na autenticação.');
    }
});

// Inicialização do Servidor
app.listen(PORT, '0.0.0.0', () => console.log('Painel Lux Bot rodando na porta ' + PORT));
