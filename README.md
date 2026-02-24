# Família 13 - Sistema de Gestão de Time

Um aplicativo web moderno e responsivo para gerenciar todos os aspectos de um time de futebol amador.

## ⚖️ Licença e Uso

Este projeto é licenciado sob a **MIT License**. Você pode:
- ✅ Usar o código livremente
- ✅ Modificar e criar versões derivadas
- ✅ Distribuir cópias
- ⚠️ **Deve incluir** cópia da licença MIT
- ⚠️ **Não há garantias** - use por sua conta e risco

**Veja [LICENSE](LICENSE) para detalhes completos.**

**Se você usar este código em produção, considere:**
- ✅ Dar crédito ao autor original
- ✅ Referenciar o repositório original
- ✅ Manter a licença MIT intacta

## 🎯 Funcionalidades

### 👥 Jogadores
- Cadastrar, editar e remover jogadores
- Informações de posição e contagem de gols
- Controle de mensalidades por mês
- Interface amigável para mobile

### ⚽ Jogos
- Registrar jogos realizados
- Informações de data, adversário e placar
- Registro automático de goleadores
- Atualização automática de estatísticas
- Possibilidade de editar ou remover jogos

### 💰 Financeiro
- Gestão de entradas e saídas de dinheiro
- Categorização por tipo
- Visualização por mês
- Cálculo automático do saldo em caixa
- Dashboard financeiro com histórico

## 📱 Otimizações para Mobile

### Design Responsivo
- **Sidebar adaptável**: Em dispositivos menores, a barra lateral se transforma em uma navegação horizontal
- **Layout flexível**: Adapta-se perfeitamente a telas de 320px até desktop
- **Modo landscape**: Funciona corretamente mesmo em modo paisagem

### Usabilidade Mobile
- **Botões grandes**: Mínimo de 44px x 44px para facilitar toques
- **Inputs otimizados**: Teclados virtuais apropriados para cada tipo de dado
- **Feedback visual**: Toast notifications e indicadores de carregamento
- **Modais responsivos**: Confirmações elegantes sem usar `alert()`
- **Tabelas responsivas**: Scroll horizontal em dispositivos pequenos

### Performance
- Código modular e organizado em módulos
- Carregamento sob demanda de funcionalidades
- Otimização de tipografia para legibilidade em telas pequenas

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Responsivo com Media Queries
- **JavaScript (ES6+)** - Lógica modular
- **Firebase** - Banco de dados em tempo real
- **Firebase Hosting** - Hospedagem

## 📦 Estrutura do Projeto

```
familia13-app/
├── index.html       # Estrutura HTML principal
├── style.css        # Estilos responsivos
├── app.js           # Lógica JavaScript modular
├── firebase.json    # Configuração Firebase
├── .firebaserc       # Configuração Firebase local
└── public/          # Arquivos estáticos publicados
```

## 🚀 Como Usar

### Acesso ao Sistema
1. Abra o aplicativo no navegador
2. Você verá o menu principal com 4 opções
3. Clique em qualquer botão para acessar o módulo desejado

### Gerenciar Jogadores
1. Clique em "Jogadores" no menu
2. Preencha o nome e posição do jogador
3. Clique em "Salvar Jogador"
4. A tabela abaixo mostrará todos os jogadores cadastrados
5. Use os checkboxes para marcar mensalidades pagas
6. Utilize os botões "Editar" e "Excluir" conforme necessário

### Cadastrar Jogos
1. Clique em "Jogos" no menu
2. Preencha data, adversário e placar
3. Selecione o número de gols de cada jogador
4. Clique em "Salvar Jogo"
5. O sistema atualizará automaticamente as estatísticas dos jogadores

### Controle Financeiro
1. Clique em "Financeiro" no menu
2. Registre entradas e saídas de dinheiro
3. Categorize cada movimentação (exemplo: "Taxa de jogadores", "Aluguel do campo")
4. O sistema calculará automaticamente o saldo total
5. Visualize o histórico completo por mês

## 💻 Responsividade

O sistema foi otimizado para:
- **Smartphones** (até 480px): Layout vertical com stack de botões
- **Tablets** (480px - 768px): Layout intermediário com navegação horizontal
- **Desktop** (acima de 768px): Layout clássico com sidebar lateral

## 🎨 Paleta de Cores

- **Primário**: #003366 (Azul escuro)
- **Secundário**: #FF6600 (Laranja)
- **Sucesso**: #28a745 (Verde)
- **Perigo**: #dc3545 (Vermelho)
- **Info**: #007bff (Azul claro)

## 🔐 Segurança

O aplicativo utiliza Firebase para segurança:
- Autenticação via Firebase
- Banco de dados em tempo real com regras de segurança
- Dados sincronizados entre dispositivos

## 📝 Notas

- Todos os dados são salvos em tempo real no Firebase
- As mensalidades são marcadas por mês (janeiro a dezembro de 2025)
- Os gols são contabilizados automaticamente ao registrar um jogo
- Ao remover um jogo, os gols dos jogadores são decrementados

## 🐛 Suporte e Contribuições

Para reportar bugs ou sugerir melhorias, entre em contato com o desenvolvedor.

---

**Versão**: 2.0 (Mobile-Optimized)  
**Última atualização**: Janeiro 2026
