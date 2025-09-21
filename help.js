// Aguardamos o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function () {
  // Definimos o caminho para a pasta help (relativo à localização atual)
  const helpPath = '../help'; // Caminho de /lessonN/theory.html para /help/

  // Array de hieróglifos para os quais existem páginas de ajuda
  //const glyphs = ['不', '亡', '其', '叀', '弗', '曰', '若', '于', '允', '占', '唯', '弜', '王', '貞', '奚', '雨', '卜', '爭', '其', '允', '曰', '占', '贞', '其', '允'];
  const glyphs = [];

  // === Criação da barra de navegação ===
function createNavigation() {
  // Obtemos o caminho atual
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/');
  const currentFile = pathParts[pathParts.length - 1];
  const currentDir = pathParts[pathParts.length - 2];
  
  // Verificamos se estamos na lição (formato lessonN)
  if (currentDir && currentDir.match(/^lesson\d+$/)) {
    const lessonNum = parseInt(currentDir.replace('lesson', ''));
    
    if (!isNaN(lessonNum) && lessonNum >= 1 && lessonNum <= 60) {
      // Criamos a barra de navegação
      const navDiv = document.createElement('div');
      navDiv.className = 'lesson-navigation';
      navDiv.style.cssText = `
        text-align: center;
        margin: 8px 0;
        padding: 4px 0;
        border-top: 1px solid #e0e0e0;
        border-bottom: 1px solid #e0e0e0;
        background-color: #fafafa;
        font-size: 13px;
        color: #666;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      // Geramos os links
      const prevLesson = lessonNum > 1 ? 
        `<a href="../lesson${lessonNum - 1}/theory.html" style="color: #666; text-decoration: none; border-bottom: 1px dotted #ccc;">lição anterior</a>` : 
        '<span style="color: #bbb;">lição anterior</span>';
        
      const nextLesson = lessonNum < 60 ? 
        `<a href="../lesson${lessonNum + 1}/theory.html" style="color: #666; text-decoration: none; border-bottom: 1px dotted #ccc;">próxima lição</a>` : 
        '<span style="color: #bbb;">próxima lição</span>';
        
      const currentLesson = `<span style="color: #888;">lição ${lessonNum}</span>`;
      const home = `<a href="../index.html" style="color: #666; text-decoration: none; border-bottom: 1px dotted #ccc;">página inicial</a>`;
      
      navDiv.innerHTML = `${prevLesson} | ${currentLesson} | ${nextLesson} | ${home}`;
      
      // Inserimos a navegação antes do primeiro elemento com classe 'text'
      const textDiv = document.querySelector('.text');
      if (textDiv && textDiv.parentNode) {
        textDiv.parentNode.insertBefore(navDiv, textDiv);
      }
    }
  }
}
  
  // Chamamos a criação da navegação
  createNavigation();

  // Função para criar link com rótulo como ícone de grau
  function createLink(char) {
    // Container para o hieróglifo
    const container = document.createElement('span');
    container.style.position = 'relative';
    container.style.display = 'inline-block';

    // Hieróglifo
    const glyphSpan = document.createElement('span');
    glyphSpan.textContent = char;

    // Link-rótulo (apenas o símbolo)
    const label = document.createElement('a');
    label.href = `${helpPath}/${char}.html`;
    label.target = '_blank';
    label.rel = 'noopener';
    label.textContent = '●';
    label.style.position = 'absolute';
    label.style.top = '-0.5em';
    label.style.right = '-0.3em';
    label.style.fontSize = '0.6em';
    label.style.color = 'rgba(216, 27, 96, 0.8)'; // Ponto levemente transparente
    label.style.textDecoration = 'none';
    label.style.zIndex = '2';
    label.style.textShadow = '0 0 2px rgba(216, 27, 96, 0.5)'; // Halo suave
    
    // Adicionamos os elementos
    container.appendChild(glyphSpan);
    container.appendChild(label);

    return container;
  }

  // Criamos TreeWalker para percorrer os nós de texto
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        const parent = node.parentNode;

        // Excluímos tags de serviço
        const excludedTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'];
        if (excludedTags.includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Excluímos elementos com atributo data-no-glyph-links
        if (parent.hasAttribute && parent.hasAttribute('data-no-glyph-links')) {
          return NodeFilter.FILTER_REJECT;
        }

        // Aceitamos se o texto não estiver vazio
        return node.textContent.trim().length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodesToReplace = [];
  let node;

  while ((node = walker.nextNode())) {
    const text = node.textContent;
    let fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let modified = false;

    // Percorremos cada caractere
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (glyphs.includes(char)) {
        // Adicionamos texto antes do hieróglifo
        if (i > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, i)));
        }
        // Adicionamos o link
        fragment.appendChild(createLink(char));
        lastIndex = i + 1;
        modified = true;
      }
    }

    // Adicionamos o restante do texto
    if (modified) {
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      nodesToReplace.push({ node, fragment });
    }
  }

  // Aplicamos as alterações aos nós de texto
  nodesToReplace.forEach(({ node, fragment }) => {
    node.parentNode.replaceChild(fragment, node);
  });

  // === Processamento da tabela #oracleTable ===
  const tableCells = document.querySelectorAll('#oracleTable td');
  tableCells.forEach((td) => {
    const child = td.firstChild;
    if (
      child &&
      child.nodeType === Node.TEXT_NODE &&
      child.textContent.trim().length === 1
    ) {
      const char = child.textContent.trim();
      if (glyphs.includes(char)) {
        td.innerHTML = ''; // Limpamos
        const link = createLink(char);
        td.appendChild(link);
        // Removemos espaçamentos extras, se necessário
        td.style.padding = '0'; // ou deixe o padrão, se estiver atrapalhando
      }
    }
  });

  // === Processamento de .char-item (por exemplo, cartões do dicionário) ===
  document.querySelectorAll('.char-item > span:first-child').forEach((span) => {
    const firstChild = span.firstChild;
    if (
      firstChild &&
      firstChild.nodeType === Node.TEXT_NODE &&
      firstChild.textContent.trim().length === 1
    ) {
      const char = firstChild.textContent.trim();
      if (glyphs.includes(char)) {
        // Salvamos o pinyin, se existir
        const pinyin = span.querySelector('.inline-pinyin');

        // Recriamos o conteúdo do span
        span.innerHTML = '';
        const link = createLink(char);
        span.appendChild(link);
        if (pinyin) {
          span.appendChild(pinyin);
        }
      }
    }
  });

  // === Processamento forçado do texto dentro de .grammar .original ===
  document.querySelectorAll('.grammar .original').forEach((el) => {
    const walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const parent = node.parentNode;
          const excludedTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'];
          if (excludedTags.includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent.trim().length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodesToReplace = [];
    let node;

    while ((node = walker.nextNode())) {
      const text = node.textContent;
      let fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let modified = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (glyphs.includes(char)) {
          if (i > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, i)));
          }
          fragment.appendChild(createLink(char));
          lastIndex = i + 1;
          modified = true;
        }
      }

      if (modified) {
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        nodesToReplace.push({ node, fragment });
      }
    }

    nodesToReplace.forEach(({ node, fragment }) => {
      node.parentNode.replaceChild(fragment, node);
    });
  });

  // === Adicional: proteção contra dimensionamento móvel ===
  // Adicionamos estilo à página, se ainda não existir
  if (!document.getElementById('glyph-link-styles')) {
    const style = document.createElement('style');
    style.id = 'glyph-link-styles';
    style.textContent = `
      a[href*="/help/"] {
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }
      @media (max-width: 768px) {
        a[href*="/help/"] {
          font-size: inherit !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
});

document.addEventListener('DOMContentLoaded', function () {
    const table = document.getElementById('oracleTable');
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            // Obtemos o conteúdo textual da célula, incluindo elementos ocultos, e removemos espaços
            const cellText = cell.textContent.trim();
            
            // Verificamos se o conteúdo da célula é apenas "_"
            if (cellText === '_') {
                // Tornamos o texto invisível, limpando textContent
                // Isso removerá o nó textual "_" , mas deixará outros elementos (por exemplo, dicas)
                cell.textContent = ''; 
            }
            // Verificamos se o conteúdo da célula é apenas "|"
            else if (cellText === '|') {
                // Mudamos a cor de fundo para bordô pastel
                cell.style.backgroundColor = '#e0bfb8'; // Exemplo de cor bordô pastel
                // Tornamos o texto (símbolo "|") invisível, limpando textContent
                cell.textContent = '';
            }
        });
    });
});