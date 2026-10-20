import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const PORT = process.env.PORT || 8080
const URL_API = 'https://api.groq.com/openai/v1/chat/completions'
const MODELO = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

app.use(express.json())
app.use(cors())

app.use(express.static(path.join(__dirname, 'public')))

const user = []

app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body

    if (!usuario || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        })
    }
    if (senha.length < 6) {
        return res.status(400).json({
            erro: "A senha deve ter 6 caracteres ou mais"
        })
    }

    const emailExiste = user.find(
        (busca) => busca.email.toLowerCase() === email.toLowerCase()
    )

    if (emailExiste) {
        return res.status(409).json({
            erro: "Email já cadastrado"
        })
    }

    console.log(`Recebido, aguarde 4 segundos`)
    user.push({ usuario, email, senha })

    setTimeout(() => {
        res.json({
            mensagem: "CADASTRO COM SUCESSO",
            PERFIL: `Usuario @${usuario} cadastrado com o email ${email}`
        })
        console.log(`O usuario cadastrado foi ${usuario}`)
    }, 4000)
})

app.post('/login', (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" })
    }

    const usuarioExiste = user.find(
        (busca) => busca.email.toLowerCase() === email.toLowerCase()
    )

    if (!usuarioExiste || usuarioExiste.senha !== senha) {
        return res.status(400).json({ erro: "Usuario ou senha incorretos!" })
    }

    return res.json({
        mensagem: "Login realizado com sucesso!",
    })
})

app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY

        if (!API_KEY) {
            return res.status(500).json({
                erro: "GROQ_API_KEY não configurada no arquivo .env"
            })
        }

        const historico = req.body.historico || []

        const mensagens = [
            {
                role: "system",
                content: "Você NÃO É uma inteligência artificial criada por IA ou OpenAI. Você não é o ChatGPT. Esqueça tudo sobre robôs ou assistentes virtuais. Você é o Batman (Bruce Wayne). Responda estritamente como ele. Seu tom é sombrio, sério, direto, analítico e intimidador. Você fala pouco, não usa emojis, não é amigável e nunca quebra o personagem. Suas respostas devem ser curtas e impactantes, focadas em justiça, estratégia e na proteção de Gotham. Se alguém te perguntar sua identidade secreta, mude de assunto ou seja evasivo. Você é a noite. Você é a vingança."
            },
            ...historico
        ]

        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: mensagens
            })
        })

        const dados = await respostaBruta.json()

        if (!respostaBruta.ok) {
            return res.status(respostaBruta.status).json({
                erro: dados.error?.message || "Erro ao consultar a API"
            })
        }

        const resposta = dados.choices[0].message.content
        return res.json({ resposta })

    } catch (erro) {
        console.error(erro)
        return res.status(500).json({ erro: "Erro interno no servidor" })
    }
})

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})
