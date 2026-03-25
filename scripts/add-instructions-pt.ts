import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ═══════════════════════════════════════
// INSTRUÇÕES MANUAIS — exercícios mais comuns
// ═══════════════════════════════════════
const MANUAL: Record<string, string> = {
  // === PEITO ===
  "Supino reto barra": "Deite no banco reto, pés firmes no chão. Segure a barra com pegada um pouco mais aberta que a largura dos ombros. Desça a barra controladamente até o meio do peito, cotovelos a 45°. Empurre de volta até estender os braços. Mantenha as escápulas retraídas durante todo o movimento.",
  "Supino inclinado barra": "Ajuste o banco a 30-45°. Segure a barra com pegada aberta. Desça até a parte superior do peito, cotovelos a 45°. Empurre de volta até a extensão completa. Escápulas retraídas e pés firmes no chão.",
  "Supino declinado barra": "Deite no banco declinado com os pés travados. Desça a barra até a parte inferior do peito. Empurre de volta até estender os braços. Mais ênfase no peitoral inferior.",
  "Supino reto halter": "Deite no banco reto com um halter em cada mão. Desça os halteres ao lado do peito, cotovelos a 45°. Empurre para cima unindo os halteres no topo. Permite maior amplitude que a barra.",
  "Supino inclinado halter": "Banco a 30-45°. Desça os halteres até a altura do peito. Empurre para cima convergindo no topo. Ênfase no peitoral superior.",
  "Crucifixo reto": "Deite no banco reto com halteres acima do peito, braços levemente flexionados. Abra os braços em arco até sentir alongamento no peito. Retorne contraindo o peitoral. Mantenha a leve flexão dos cotovelos o tempo todo.",
  "Crucifixo inclinado": "Banco a 30°. Abra os braços em arco lateral, cotovelos levemente flexionados. Retorne contraindo o peitoral superior. Não deixe os halteres descerem demais.",
  "Peck deck (voador)": "Sente na máquina com as costas apoiadas. Segure as alças com os cotovelos levemente flexionados. Junte os braços à frente contraindo o peito. Retorne controladamente.",
  "Crossover alto → baixo (ênfase inferior)": "Posicione as polias altas. Segure as alças e dê um passo à frente. Puxe os cabos de cima para baixo, cruzando na frente do corpo. Contraia o peitoral inferior no ponto final.",
  "Crossover baixo → alto (ênfase superior)": "Posicione as polias baixas. Puxe os cabos de baixo para cima, cruzando na frente do corpo na altura do peito. Ênfase no peitoral superior.",
  "Flexão tradicional": "Mãos no chão na largura dos ombros, corpo reto dos pés à cabeça. Desça o peito até quase tocar o chão. Empurre de volta. Mantenha o core contraído.",
  "Chest press máquina": "Sente na máquina com as costas apoiadas. Segure as alças na altura do peito. Empurre para frente até estender os braços. Retorne controladamente.",

  // === COSTAS ===
  "Barra fixa pronada": "Segure a barra com pegada pronada (palmas para frente), mais aberta que os ombros. Puxe o corpo para cima até o queixo passar a barra. Desça controladamente. Inicie o movimento retraindo as escápulas.",
  "Puxada frente pegada aberta": "Sente no pulley com a coxa travada. Segure a barra com pegada aberta. Puxe a barra até o peito, projetando o peito para frente. Retorne controladamente esticando os braços.",
  "Puxada frente pegada fechada": "Use o triângulo ou barra fechada. Puxe até o peito, cotovelos apontando para baixo. Ênfase no dorsal e meio das costas.",
  "Remada curvada barra": "Em pé, incline o tronco a 45° com joelhos levemente flexionados. Puxe a barra até o abdômen, cotovelos junto ao corpo. Desça controladamente. Não arredonde a lombar.",
  "Remada unilateral halter": "Apoie um joelho e uma mão no banco. Com o outro braço, puxe o halter até a lateral do abdômen. Cotovelo junto ao corpo. Desça controladamente.",
  "Remada baixa no cabo": "Sente com os pés apoiados e joelhos levemente flexionados. Puxe a barra/triângulo até o abdômen, retraindo as escápulas. Retorne esticando os braços.",
  "Levantamento terra": "Pés na largura do quadril, barra sobre o meio do pé. Agache segurando a barra. Levante estendendo quadril e joelhos simultaneamente. Mantenha a barra rente ao corpo e coluna neutra.",
  "Pullover com halter": "Deite no banco com um halter seguro acima do peito, braços estendidos. Desça o halter atrás da cabeça em arco. Retorne contraindo o dorsal. Cotovelos levemente flexionados.",
  "Hiperextensão": "Posicione-se no banco 45° com o quadril apoiado. Desça o tronco controladamente. Suba contraindo os eretores da coluna e glúteos. Não hiperextenda além da linha neutra.",
  "Remada cavalinho (T-bar)": "Posicione-se sobre o aparelho T-bar. Puxe a barra até o peito, retraindo as escápulas. Desça controladamente. Mantenha o tronco estável.",

  // === OMBROS ===
  "Elevação lateral com halteres": "Em pé, halteres ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros, cotovelos levemente flexionados. Desça controladamente. Não balance o corpo.",
  "Elevação frontal com halter": "Em pé, halteres na frente das coxas. Eleve um braço de cada vez (ou ambos) até a altura dos ombros. Desça controladamente. Pegada neutra ou pronada.",
  "Desenvolvimento com halteres": "Sentado ou em pé, halteres na altura dos ombros. Empurre para cima até estender os braços. Desça até os halteres voltarem à altura das orelhas.",
  "Desenvolvimento Arnold": "Comece com halteres na frente do peito, palmas para você. Gire as mãos enquanto empurra para cima. No topo, palmas para frente. Retorne girando de volta.",
  "Desenvolvimento com barra": "Sentado ou em pé, barra na frente dos ombros. Empurre para cima até estender. Desça até a altura do queixo. Mantenha o core firme.",
  "Face pull (corda)": "Polia na altura do rosto. Puxe a corda em direção ao rosto, abrindo os cotovelos para os lados. Foque na retração das escápulas e rotação externa. Excelente para saúde dos ombros.",
  "Crucifixo inverso com halteres": "Incline o tronco a 45° ou deite no banco inclinado. Halteres pendurados. Abra os braços lateralmente contraindo o deltóide posterior. Retorne controladamente.",
  "Reverse peck deck": "Sente de frente para o encosto da máquina peck deck. Segure as alças. Abra os braços para trás contraindo o posterior do ombro. Retorne controladamente.",

  // === BÍCEPS ===
  "Rosca direta barra reta": "Em pé, segure a barra com pegada supinada na largura dos ombros. Flexione os cotovelos levantando a barra até os ombros. Desça controladamente. Mantenha os cotovelos fixos ao lado do corpo.",
  "Rosca direta barra W (EZ)": "Mesma execução da rosca direta, mas com a barra W que reduz o estresse nos punhos. Pegada nas angulações da barra.",
  "Rosca alternada": "Em pé, halteres ao lado do corpo. Flexione um braço de cada vez, girando a palma para cima durante a subida. Desça controladamente alternando os lados.",
  "Rosca concentrada": "Sentado, cotovelo apoiado na parte interna da coxa. Flexione o braço levantando o halter até o ombro. Desça controladamente. Isola totalmente o bíceps.",
  "Rosca Scott barra": "Apoie os braços no banco Scott. Segure a barra e flexione até os ombros. Desça controladamente sem estender completamente. Isola o bíceps eliminando impulso.",
  "Rosca martelo": "Em pé, halteres com pegada neutra (palmas para dentro). Flexione os cotovelos sem girar as mãos. Trabalha bíceps braquial e braquiorradial.",
  "Rosca no pulley barra reta": "De frente para a polia baixa. Segure a barra e flexione os cotovelos. Tensão constante do cabo. Desça controladamente.",
  "Rosca inclinada (banco inclinado)": "Banco a 45°, halteres pendurados. Flexione os braços sem mover os cotovelos. O banco inclinado pré-alonga o bíceps, aumentando a ativação.",
  "Rosca spider (apoio no banco inclinado)": "Apoie o peito no banco inclinado. Braços pendurados à frente. Flexione os cotovelos. O ângulo elimina qualquer impulso.",
  "Rosca 21 (método)": "Faça 7 repetições da metade inferior, 7 da metade superior e 7 completas. Total de 21 reps. Método intensificador para bíceps.",

  // === TRÍCEPS ===
  "Tríceps na corda": "De frente para a polia alta. Segure a corda, cotovelos fixos ao lado do corpo. Estenda os braços para baixo, abrindo a corda no final. Retorne controladamente até 90°.",
  "Tríceps barra reta": "Polia alta com barra reta. Cotovelos fixos, estenda os braços para baixo. Retorne até 90°. Não deixe os cotovelos se moverem para frente.",
  "Tríceps testa (barra reta)": "Deite no banco, barra acima do peito. Flexione os cotovelos descendo a barra em direção à testa. Estenda de volta. Cotovelos apontando para o teto.",
  "Tríceps testa com halteres": "Deite no banco com halteres acima do peito. Flexione os cotovelos descendo os halteres ao lado da cabeça. Estenda de volta. Cotovelos fixos.",
  "Tríceps francês com halter (bilateral)": "Sentado ou em pé, segure um halter com ambas as mãos atrás da cabeça. Estenda os braços para cima. Desça controladamente atrás da cabeça. Cotovelos apontando para cima.",
  "Tríceps francês unilateral": "Um halter em uma mão atrás da cabeça. Estenda o braço para cima. Desça controladamente. Cotovelo apontando para o teto.",
  "Tríceps coice (kickback)": "Incline o tronco, cotovelo fixo junto ao corpo a 90°. Estenda o antebraço para trás. Contraia no topo. Retorne controladamente.",
  "Mergulho em banco": "Mãos apoiadas no banco atrás do corpo, pernas estendidas. Flexione os cotovelos descendo o corpo. Empurre de volta. Quanto mais longe os pés, mais difícil.",
  "Supino fechado": "Deite no banco, pegada na barra com mãos na largura dos ombros ou mais fechada. Desça a barra até o peito. Empurre de volta. Cotovelos junto ao corpo.",

  // === QUADRÍCEPS ===
  "Agachamento livre": "Barra apoiada no trapézio. Pés na largura dos ombros. Agache até as coxas ficarem paralelas ao chão (ou mais). Empurre o chão para subir. Joelhos na direção dos pés, coluna neutra.",
  "Agachamento frontal": "Barra apoiada nos deltóides frontais, cotovelos elevados. Agache mantendo o tronco mais vertical. Exige mais mobilidade. Ênfase em quadríceps.",
  "Leg press 45°": "Pés na plataforma na largura dos ombros. Destrave e desça controladamente até 90° de flexão. Empurre sem travar os joelhos no topo.",
  "Hack machine": "Costas apoiadas no encosto, ombros sob os apoios. Desça controladamente até 90°. Empurre de volta. Ênfase em quadríceps.",
  "Cadeira extensora": "Sente com as costas apoiadas, tornozelos sob o rolo. Estenda as pernas contraindo o quadríceps. Desça controladamente. Não force a extensão total se houver desconforto no joelho.",
  "Agachamento búlgaro": "Pé traseiro elevado no banco. Desça o corpo flexionando o joelho da frente até 90°. Empurre de volta. Excelente para unilateral e equilíbrio.",
  "Afundo (lunge)": "Dê um passo à frente, desça o joelho traseiro em direção ao chão. Joelho da frente não ultrapassa a ponta do pé. Empurre de volta.",

  // === POSTERIOR ===
  "Mesa flexora": "Deite de bruços na máquina. Flexione os joelhos puxando o rolo em direção ao glúteo. Desça controladamente. Não levante o quadril do apoio.",
  "Stiff": "Em pé, barra na frente das coxas. Desça a barra deslizando nas pernas, joelhos levemente flexionados. Sinta o alongamento no posterior. Suba contraindo glúteos e posterior.",
  "Stiff com halter": "Mesmo movimento do stiff, mas com halteres ao lado do corpo. Permite ajuste individual de cada lado.",
  "Cadeira flexora": "Sentado na máquina, flexione os joelhos puxando o rolo para baixo e para trás. Retorne controladamente.",

  // === GLÚTEOS ===
  "Hip thrust": "Costas apoiadas no banco, barra sobre o quadril. Pés no chão na largura do quadril. Empurre o quadril para cima contraindo os glúteos. Desça controladamente.",
  "Glute bridge": "Deite no chão, joelhos flexionados, pés no chão. Eleve o quadril contraindo os glúteos. Desça controladamente. Pode usar peso sobre o quadril.",
  "Cadeira abdutora": "Sente na máquina com os joelhos juntos. Abra as pernas empurrando as almofadas para fora. Retorne controladamente. Trabalha glúteo médio.",
  "Coice no cabo (kickback)": "De frente para a polia, caneleira no tornozelo. Estenda a perna para trás contraindo o glúteo. Retorne controladamente. Tronco levemente inclinado.",
  "Máquina de glúteo": "Posicione-se na máquina conforme indicação. Empurre a plataforma para trás com uma perna, contraindo o glúteo. Retorne controladamente.",

  // === PANTURRILHA ===
  "Panturrilha em pé": "Na máquina, ombros sob os apoios, bola dos pés na plataforma. Suba na ponta dos pés contraindo a panturrilha. Desça alongando bem. Movimento completo.",
  "Panturrilha sentado": "Sentado, joelhos sob o apoio, bola dos pés na plataforma. Suba e desça controladamente. Ênfase no sóleo (parte profunda da panturrilha).",
  "Panturrilha no leg press": "No leg press, apoie só a bola dos pés na plataforma. Empurre estendendo os tornozelos. Retorne alongando.",

  // === COSTAS EXTRAS ===
  "Terra romeno": "Em pé, barra na frente das coxas. Desça empurrando o quadril para trás, barra rente às pernas. Joelhos levemente flexionados. Suba contraindo posterior e glúteos.",
  "Terra sumô": "Pés afastados, pontas para fora. Agache e segure a barra entre as pernas. Levante estendendo quadril e joelhos. Trabalha mais adutores e glúteos.",
  "Good morning": "Barra no trapézio. Incline o tronco à frente empurrando o quadril para trás. Joelhos levemente flexionados. Suba contraindo posterior e eretores.",
  "Extensão lombar (banco 45°)": "Apoie o quadril no banco 45°, mãos cruzadas no peito. Desça o tronco controladamente. Suba até alinhar com as pernas. Não hiperextenda.",
}

// ═══════════════════════════════════════
// GERADOR AUTOMÁTICO para exercícios sem instrução manual
// ═══════════════════════════════════════
function generateInstruction(name: string, muscle: string, equipment: string): string {
  const n = name.toLowerCase()

  // Equipment-specific setup
  const setupByEquip: Record<string, string> = {
    Barbell: "Segure a barra com pegada firme",
    Dumbbell: "Segure o(s) halter(es) com pegada firme",
    Cable: "Ajuste a polia na altura adequada e segure a alça/barra",
    Machine: "Ajuste a máquina para seu biotipo (altura do banco/apoios)",
    Bodyweight: "Posicione-se corretamente",
    Band: "Prenda o elástico de forma segura",
    Other: "Posicione-se no equipamento",
    Kettlebell: "Segure o kettlebell com pegada firme",
  }

  const setup = setupByEquip[equipment] || "Posicione-se corretamente"

  // Pattern-based instructions
  if (n.includes("rosca") && n.includes("scott")) {
    return `Apoie os braços no banco Scott. ${setup}. Flexione os cotovelos levantando o peso até a contração máxima do bíceps. Desça controladamente sem estender completamente os braços. O banco elimina o impulso do corpo.`
  }
  if (n.includes("rosca") && n.includes("martelo")) {
    return `Em pé, segure os halteres com pegada neutra (palmas uma para a outra). Flexione os cotovelos levantando os halteres sem girar os punhos. Desça controladamente. Trabalha bíceps braquial e braquiorradial.`
  }
  if (n.includes("rosca") && n.includes("cabo") || n.includes("rosca") && n.includes("pulley")) {
    return `${setup}. Mantenha os cotovelos fixos ao lado do corpo. Flexione os cotovelos puxando em direção aos ombros. O cabo mantém tensão constante durante todo o movimento. Desça controladamente.`
  }
  if (n.includes("rosca")) {
    return `${setup}. Mantenha os cotovelos fixos ao lado do corpo. Flexione os cotovelos levantando o peso em direção aos ombros. Contraia o bíceps no topo do movimento. Desça controladamente sem balançar o corpo.`
  }
  if (n.includes("tríceps") && n.includes("cabo") || n.includes("tríceps") && n.includes("pulley") || n.includes("tríceps") && n.includes("corda")) {
    return `${setup}. Mantenha os cotovelos fixos ao lado do corpo. Estenda os braços para baixo contraindo o tríceps. Retorne controladamente até 90° de flexão. Não deixe os cotovelos se moverem.`
  }
  if (n.includes("tríceps") && n.includes("testa")) {
    return `Deite no banco, peso acima do peito com braços estendidos. Flexione os cotovelos descendo o peso em direção à testa. Estenda de volta contraindo o tríceps. Cotovelos apontando para o teto o tempo todo.`
  }
  if (n.includes("tríceps") && n.includes("francês") || n.includes("acima da cabeça")) {
    return `${setup} atrás da cabeça. Cotovelos apontando para cima. Estenda os braços para cima contraindo o tríceps. Desça controladamente atrás da cabeça. Alonga bem a porção longa do tríceps.`
  }
  if (n.includes("tríceps")) {
    return `${setup}. Foque em manter os cotovelos fixos. Estenda os braços contraindo o tríceps. Retorne controladamente. Não use impulso do corpo — isole o tríceps.`
  }
  if (n.includes("elevação lateral")) {
    return `${setup}. Em pé ou sentado, eleve os braços lateralmente até a altura dos ombros. Cotovelos levemente flexionados. Desça controladamente. Não balance o corpo. Imagine derramar água de um copo no topo.`
  }
  if (n.includes("elevação frontal")) {
    return `${setup}. Eleve o(s) braço(s) à frente do corpo até a altura dos ombros. Desça controladamente. Trabalha a porção anterior do deltóide. Não use impulso.`
  }
  if (n.includes("desenvolvimento") || n.includes("press") && muscle === "Shoulders") {
    return `${setup} na altura dos ombros. Empurre para cima até estender completamente os braços. Desça controladamente até a altura das orelhas. Mantenha o core firme para estabilidade.`
  }
  if (n.includes("crucifixo inverso") || n.includes("reverse peck")) {
    return `${setup}. Abra os braços para trás focando na contração do deltóide posterior e retração das escápulas. Retorne controladamente. Cotovelos levemente flexionados.`
  }
  if (n.includes("face pull")) {
    return `Polia na altura do rosto com corda. Puxe em direção ao rosto abrindo os cotovelos para os lados. Foque em retrair as escápulas e rotação externa dos ombros. Excelente para saúde articular.`
  }
  if (n.includes("supino") && muscle === "Chest") {
    return `${setup}. Escápulas retraídas e pés firmes no chão. Desça o peso controladamente até o peito. Empurre de volta até estender os braços. Cotovelos a 45° do corpo.`
  }
  if (n.includes("crucifixo") && muscle === "Chest") {
    return `${setup}. Braços levemente flexionados. Abra os braços em arco lateral sentindo o alongamento do peitoral. Retorne contraindo o peito. Mantenha a leve flexão dos cotovelos o tempo todo.`
  }
  if (n.includes("crossover")) {
    return `${setup}. Dê um passo à frente para estabilidade. Puxe os cabos em arco contraindo o peitoral. Contraia no ponto final. Retorne controladamente sentindo o alongamento.`
  }
  if (n.includes("puxada") || n.includes("pulldown")) {
    return `Sente no pulley com as coxas travadas. ${setup}. Puxe até o peito projetando o peito para frente e retraindo as escápulas. Retorne esticando completamente os braços.`
  }
  if (n.includes("remada")) {
    return `${setup}. Puxe o peso em direção ao abdômen/peito, retraindo as escápulas. Cotovelos junto ao corpo. Desça controladamente. Mantenha a coluna neutra e o core firme.`
  }
  if (n.includes("pullover")) {
    return `Deite no banco, peso acima do peito, braços estendidos. Desça o peso atrás da cabeça em arco controlado. Retorne contraindo o dorsal. Cotovelos levemente flexionados.`
  }
  if (n.includes("encolhimento") || n.includes("shrug")) {
    return `${setup}. Eleve os ombros em direção às orelhas contraindo o trapézio. Segure a contração por 1-2 segundos. Desça controladamente. Não gire os ombros.`
  }
  if (n.includes("agachamento") || n.includes("squat")) {
    return `${setup}. Pés na largura dos ombros. Desça flexionando quadril e joelhos até pelo menos 90°. Empurre o chão para subir. Joelhos na direção dos pés, coluna neutra, core firme.`
  }
  if (n.includes("leg press")) {
    return `Pés na plataforma na largura dos ombros. Destrave a trava de segurança. Desça controladamente até 90° de flexão. Empurre de volta sem travar os joelhos no topo.`
  }
  if (n.includes("extensora")) {
    return `Sente com as costas apoiadas, tornozelos sob o rolo. Estenda as pernas contraindo o quadríceps. Desça controladamente. Não force a hiperextensão do joelho.`
  }
  if (n.includes("flexora") || n.includes("mesa flexora")) {
    return `Posicione-se na máquina conforme indicação. Flexione os joelhos puxando o rolo. Contraia o posterior da coxa. Retorne controladamente. Não levante o quadril.`
  }
  if (n.includes("afundo") || n.includes("lunge") || n.includes("passada")) {
    return `${setup}. Dê um passo à frente. Desça o joelho traseiro em direção ao chão. Joelho da frente não ultrapassa a ponta do pé. Empurre de volta à posição inicial.`
  }
  if (n.includes("stiff") || n.includes("terra romeno") && muscle === "Hamstrings") {
    return `Em pé com o peso na frente das coxas. Desça empurrando o quadril para trás, peso rente às pernas. Joelhos levemente flexionados. Sinta o alongamento no posterior. Suba contraindo glúteos.`
  }
  if (n.includes("hip thrust")) {
    return `Costas apoiadas no banco, peso sobre o quadril. Pés no chão na largura do quadril. Empurre o quadril para cima contraindo os glúteos ao máximo. Desça controladamente.`
  }
  if (n.includes("panturrilha") || n.includes("calf")) {
    return `Posicione a bola dos pés na plataforma. Suba na ponta dos pés contraindo a panturrilha. Desça alongando bem o calcanhar abaixo da plataforma. Movimento completo e controlado.`
  }
  if (n.includes("abdut")) {
    return `${setup}. Abra as pernas empurrando contra a resistência. Contraia o glúteo médio. Retorne controladamente. Mantenha as costas apoiadas.`
  }
  if (n.includes("coice") || n.includes("kickback") && muscle === "Glutes") {
    return `${setup}. Estenda a perna para trás contraindo o glúteo no topo. Retorne controladamente. Tronco levemente inclinado. Não arqueie a lombar.`
  }
  if (n.includes("flexão") && muscle === "Chest") {
    return `Mãos no chão, corpo reto dos pés à cabeça. Desça o peito em direção ao chão. Empurre de volta. Core contraído o tempo todo. Cotovelos a 45°.`
  }
  if (n.includes("paralela") || n.includes("mergulho") || n.includes("dip")) {
    return `Segure as barras paralelas e suspenda o corpo. Desça flexionando os cotovelos controladamente. Empurre de volta até estender os braços. Incline o tronco conforme o foco muscular.`
  }
  if (n.includes("pike") || n.includes("handstand")) {
    return `Posição de flexão com quadril elevado (formato de V invertido). Flexione os cotovelos descendo a cabeça em direção ao chão. Empurre de volta. Ênfase nos ombros.`
  }
  if (n.includes("pull-apart") || n.includes("elástico")) {
    return `${setup}. Execute o movimento com controle, focando na contração do músculo alvo. Mantenha a tensão constante do elástico. Retorne controladamente.`
  }
  if (n.includes("trx") || n.includes("suspensão")) {
    return `Segure as alças do TRX. Ajuste o ângulo do corpo para a dificuldade desejada. Execute o movimento com controle total. Quanto mais inclinado, mais difícil.`
  }

  // Generic fallback based on muscle group
  const muscleHints: Record<string, string> = {
    Chest: "Foque na contração do peitoral durante a fase concêntrica",
    Back: "Inicie o movimento retraindo as escápulas. Foque na contração das costas",
    Shoulders: "Mantenha o core firme. Não use impulso do corpo",
    Biceps: "Mantenha os cotovelos fixos. Foque na contração do bíceps",
    Triceps: "Mantenha os cotovelos fixos. Isole o tríceps",
    Quadriceps: "Joelhos na direção dos pés. Mantenha a coluna neutra",
    Hamstrings: "Foque no alongamento e contração do posterior da coxa",
    Glutes: "Contraia o glúteo no topo do movimento. Não hiperextenda a lombar",
    Calves: "Amplitude completa: alonga embaixo, contrai em cima",
    Traps: "Foque na contração do trapézio. Não use impulso",
  }

  const hint = muscleHints[muscle] || "Execute com controle e amplitude completa"
  return `${setup}. Execute o movimento com controle total e amplitude adequada. ${hint}. Respire: expire na fase de esforço, inspire no retorno. Desça/retorne controladamente sem usar impulso.`
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function main() {
  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, muscle: true, equipment: true, instructions: true },
  })

  console.log(`Total exercícios: ${exercises.length}\n`)

  let updated = 0
  let alreadyPt = 0

  for (const ex of exercises) {
    const currentInstr = ex.instructions?.trim() || ""
    const isEnglish = /\b(the|and|with|your|grip|bar |press |pull |push |sit |lie |stand |hold |keep |lower|raise)\b/i.test(currentInstr)
    const isEmpty = currentInstr.length === 0

    if (!isEmpty && !isEnglish) {
      alreadyPt++
      continue // Already in Portuguese
    }

    // Check manual instructions first
    const manual = MANUAL[ex.name]
    if (manual) {
      await prisma.exercise.update({ where: { id: ex.id }, data: { instructions: manual } })
      updated++
      continue
    }

    // Generate instruction
    const generated = generateInstruction(ex.name, ex.muscle, ex.equipment)
    await prisma.exercise.update({ where: { id: ex.id }, data: { instructions: generated } })
    updated++
  }

  console.log(`Já em português: ${alreadyPt}`)
  console.log(`Atualizados: ${updated}`)

  // Verify
  const final = await prisma.exercise.findMany({ select: { instructions: true } })
  const withInstr = final.filter((e) => e.instructions && e.instructions.trim().length > 10)
  console.log(`\nExercícios com instruções: ${withInstr.length}/${final.length}`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1) })
