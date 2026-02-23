

# Plano de Correções Imediatas - Invest Veiculos

Analisei todas as 17 demandas e separei o que pode ser resolvido agora no codigo, do que depende de acao externa (edicao de video, configuracao de DNS, etc).

---

## O que vou resolver agora (7 itens)

### 1. Substituir "Matheus Veiculos" por "Invest Veiculos" (Item 14)
Encontrei 6 arquivos com referencias a "Matheus Veiculos":
- **Sidebar.tsx**: Logo "MV" e texto "Matheus Veiculos" no menu lateral -> trocar para "IV" e "Invest Veiculos"
- **Auth.tsx**: Texto de copyright e alt da imagem -> trocar para "Invest Veiculos"
- **DocumentationLayout.tsx**: Titulo do PDF e rodapes -> trocar para "Invest Veiculos"
- **OverviewSection.tsx**: Descricao do sistema -> trocar para "Invest Veiculos"
- **UTMBuilder.tsx**: URL base de exemplo -> trocar para `investveiculos.com`
- **WhatsAppInstances.tsx**: Placeholder de exemplo -> trocar para `invest-veiculos-1`

### 2. Telefone visivel no card do Lead no Pipeline (Item 13)
O LeadCard ja mostra o telefone no modo compacto (usado no pipeline). Porem, vou garantir que o telefone apareca de forma mais destacada e visivel, com fonte um pouco maior e formatacao clara, tanto no card compacto quanto no card normal.

### 3. Bug do agente desligando no F5 (Item 9)
O hook `useCRMAgent` ja busca o estado do banco de dados (campo `status` e `whatsapp_auto_reply` da tabela `ai_agents`). Vou verificar se o `toggleAgent` esta persistindo corretamente e se a query esta funcionando. O codigo atual parece correto - ele salva no banco e busca do banco. Vou adicionar `staleTime` e `refetchOnWindowFocus` para garantir que o estado carregue corretamente apos F5.

### 4. Qualificacao do lead nao funcionava (Item 10)
Vou verificar o fluxo de qualificacao e garantir que os componentes estejam conectados corretamente ao backend.

### 5. Tipografia/Fontes (Item 1) - Verificacao
O sistema ja usa "Plus Jakarta Sans" como fonte principal e "Playfair Display" como fonte display. As fontes estao configuradas no `tailwind.config.ts` mas nao ha importacao delas no `index.html`. Vou garantir que as fontes estejam sendo importadas corretamente via Google Fonts.

### 6. Tom do bot (Item 16)
Vou verificar o system prompt do agente AI e ajustar o tom padrao para ser mais profissional.

### 7. Tempo de expiracao do lead (Item 8)
Vou criar a estrutura basica para configurar o tempo de expiracao por vendedor.

---

## O que NAO da pra resolver aqui (precisa de acao externa)

| # | Item | Motivo |
|---|------|--------|
| 2 | Video da Home | Requer edicao do arquivo de video (corte, animacao). Nao e codigo. |
| 3 | Imagem de fundo | O codigo ja suporta imagem/video. Se a foto for fornecida, basta adicionar. |
| 4 | Referencias visuais (ShiftCar, Gatti, 7Place) | Redesign visual completo - requer projeto separado |
| 6 | Nome do assistente | Configuracao no banco de dados (campo `name` do agente). Pode ser feito via UI de agentes. |
| 11 | Round-robin | Ja implementado, precisa de teste real com leads. |
| 12 | Bot respondendo e distribuindo | Ja implementado, precisa de validacao em producao. |
| 15 | Integracao Meta Ads | Credenciais ja estao nos secrets. Precisa verificar se o sync esta rodando. |
| 17 | Migracao dominio | Configuracao de DNS na Hostgator, nao e codigo. |

---

## Detalhes Tecnicos

### Arquivos que serao modificados:

1. **src/components/layout/Sidebar.tsx** - "MV" -> "IV", "Matheus Veiculos" -> "Invest Veiculos"
2. **src/pages/Auth.tsx** - Copyright e alt text
3. **src/components/documentation/DocumentationLayout.tsx** - PDF e rodapes
4. **src/components/documentation/sections/OverviewSection.tsx** - Descricao
5. **src/components/marketing/UTMBuilder.tsx** - URL base
6. **src/components/whatsapp/WhatsAppInstances.tsx** - Placeholder
7. **src/components/crm/LeadCard.tsx** - Telefone mais visivel
8. **src/hooks/useCRMAgent.ts** - Melhorar persistencia do estado
9. **index.html** - Importar fontes do Google Fonts (se ausente)

### Prioridade de execucao:
1. Substituir "Matheus Veiculos" (rapido, alto impacto visual)
2. Telefone no card do lead (pedido 2x pelo cliente)
3. Persistencia do agente no F5
4. Fontes
5. Demais itens

