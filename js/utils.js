// Funções Utilitárias

export function formatarDinheiro(valor) {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  } else if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(0)}mil`;
  }
  return `R$ ${valor}`;
}

export function formatarDinheiroCompleto(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}

export function sortearItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function gerarNumeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
