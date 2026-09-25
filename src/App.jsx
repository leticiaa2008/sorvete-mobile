import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const [carrinho, setCarrinho] = useState(() => {
    const salvo = localStorage.getItem('scoop_carrinho');

    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch {
        return [];
      }
    }

    return [];
  });

  const [clienteNome, setClienteNome] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'scoop_carrinho',
      JSON.stringify(carrinho)
    );
  }, [carrinho]);

  async function carregarProdutos() {
    setCarregando(true);
    setErro('');

    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('id');

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      setErro(error.message);
      setProdutos([]);
    } else {
      setProdutos(data || []);
    }

    setCarregando(false);
  }

  function formatarPreco(preco) {
    return Number(preco || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function imagemProduto(produto) {
    if (
      produto.imagem &&
      typeof produto.imagem === 'string' &&
      produto.imagem.startsWith('http')
    ) {
      return produto.imagem;
    }

    return '/assets/images/logo.png';
  }

  function adicionarItem(produto) {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setCarrinho((carrinhoAtual) => {
      const existente = carrinhoAtual.find(
        (item) => String(item.id) === String(produto.id)
      );

      if (existente) {
        return carrinhoAtual.map((item) =>
          String(item.id) === String(produto.id)
            ? {
                ...item,
                quantidade: item.quantidade + 1
              }
            : item
        );
      }

      return [
        ...carrinhoAtual,
        {
          id: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco),
          quantidade: 1
        }
      ];
    });
  }

  function mudarQuantidade(id, delta) {
    setCarrinho((carrinhoAtual) =>
      carrinhoAtual
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantidade: item.quantidade + delta
              }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function calcularTotal() {
    return carrinho.reduce(
      (total, item) =>
        total + Number(item.preco) * item.quantidade,
      0
    );
  }

  async function fecharPedido() {
    if (carrinho.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    if (!clienteNome || !clienteEndereco) {
      alert(
        'Por favor, preencha seu nome e endereço de entrega!'
      );
      return;
    }

    const total = calcularTotal();

    const payloadPedido = {
      cliente_nome: clienteNome,
      cliente_endereco: clienteEndereco,
      itens: carrinho,
      total
    };

    setEnviandoPedido(true);

    try {
      const resposta = await fetch(
        'https://sorvete-back-certo.vercel.app/api/pedidos',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payloadPedido)
        }
      );

      if (!resposta.ok) {
        throw new Error('Erro ao enviar pedido');
      }

      alert('Pedido enviado com sucesso para a cozinha!');

      setClienteNome('');
      setClienteEndereco('');
      setCarrinho([]);
      setCarrinhoAberto(false);
    } catch (erro) {
      console.error(erro);

      alert(
        'Ops! Ocorreu um problema de conexão. Tente novamente.'
      );
    } finally {
      setEnviandoPedido(false);
    }
  }

  return (
    <div className="font-texto bg-cream text-dark min-h-screen">

      {/* HEADER */}
      <header className="flex justify-between items-center px-6 py-4 md:px-16 bg-white shadow-sm">
        <img
          src="/assets/images/logo.png"
          className="w-32 md:w-40"
          alt="Logo Scoop Sorveteria"
        />

        <nav className="hidden md:block">
          <ul className="flex flex-row gap-6 p-0 font-medium">
            <li>
              <a
                href="#cardapio"
                className="hover:text-primary transition"
              >
                Cardápio
              </a>
            </li>

            <li>
              <a
                href="#footer"
                className="hover:text-primary transition"
              >
                Sobre
              </a>
            </li>

            <li>
              <a
                href="https://wa.me/5515987654321"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* HERO */}
      <main>
        <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-16">

          <div className="md:w-1/2 text-center md:text-left">

            <h1 className="font-titulo text-4xl md:text-6xl mb-6 leading-tight">
              O prazer do
              <br />

              <span className="text-primary">
                sorvete artesanal
              </span>
            </h1>

            <p className="mb-8 text-gray-600">
              Sabores únicos preparados diariamente com
              ingredientes frescos.
            </p>

            <a
              href="#cardapio"
              className="inline-block bg-primary text-white px-8 py-3 rounded-full shadow-md hover:scale-105 transition"
            >
              Ver Cardápio
            </a>

          </div>

          <div className="md:w-1/2 mt-10 md:mt-0">
            <img
              src="/assets/images/banner.png"
              className="w-full max-w-md mx-auto"
              alt="Banner Scoop Sorveteria"
            />
          </div>

        </section>

        {/* CARDÁPIO */}
        <section
          id="cardapio"
          className="border-t border-dashed border-gray-400 w-full max-w-[700px] mx-auto mt-24 pt-12 pb-20 px-4 text-center"
        >

          <h1 className="text-3xl font-bold mb-6">
            Cardápio
          </h1>

          <div className="flex justify-center gap-2 mt-6 pb-4">

            <button className="px-6 py-2 rounded-full font-bold text-sm bg-primary text-white">
              Todos
            </button>

          </div>

          <div className="mt-8">

            <div className="text-left text-dark font-extrabold text-[22px] mb-4">
              Nossos produtos
            </div>

            {carregando && (
              <div className="py-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {erro && (
              <div className="bg-red-50 text-red-500 rounded-xl p-4 text-left">
                <strong>Erro ao carregar produtos:</strong>
                <br />
                {erro}
              </div>
            )}

            {!carregando &&
              !erro &&
              produtos.length === 0 && (
                <p className="text-gray-400 py-10">
                  Nenhum produto encontrado.
                </p>
              )}

            {!erro && produtos.length > 0 && (
              <div className="grid grid-cols-2 gap-4">

                {produtos.map((produto) => (
                  <div
                    key={produto.id}
                    className="bg-white rounded-[20px] p-3 shadow-sm border border-gray-100 relative flex flex-col hover:shadow-md transition-shadow group"
                  >

                    <button
                      onClick={() =>
                        setProdutoSelecionado(produto)
                      }
                      className="text-left"
                    >
                      <img
                        src={imagemProduto(produto)}
                        className="w-full h-24 object-contain mb-2 group-hover:scale-105 transition-transform"
                        alt={produto.nome}
                        onError={(e) => {
                          e.currentTarget.src =
                            '/assets/images/logo.png';
                        }}
                      />

                      <div className="w-full mt-auto">

                        <h4 className="font-bold text-dark text-sm leading-tight">
                          {produto.nome}
                        </h4>

                        <p className="text-primary font-bold text-xs">
                          {formatarPreco(produto.preco)}
                        </p>

                      </div>
                    </button>

                    <button
                      onClick={() => adicionarItem(produto)}
                      className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold mt-3 shadow-md active:scale-95 transition-all"
                    >
                      Adicionar
                    </button>

                  </div>
                ))}

              </div>
            )}

          </div>

        </section>
      </main>

      {/* FOOTER */}
      <footer
        id="footer"
        className="bg-dark text-white text-center py-14 px-6"
      >
        <h3 className="font-titulo text-2xl mb-4">
          Scoop Sorveteria
        </h3>

        <p>Rua das Flores, 120</p>
        <p>WhatsApp: (11) 98765-4321</p>
        <p>Aberto das 13h às 22h</p>
      </footer>

      {/* WHATSAPP */}
      <a
        href="https://wa.me/5515987654321"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40"
      >
        <img
          src="/assets/images/whatsapp.png"
          className="w-14"
          alt="WhatsApp"
        />
      </a>

      {/* MODAL DE DETALHES */}
      {produtoSelecionado && (
        <div
          className="fixed inset-0 bg-black/70 z-[80] flex justify-center items-center px-4"
          onClick={() => setProdutoSelecionado(null)}
        >

          <div
            className="bg-white w-full max-w-[400px] rounded-[30px] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setProdutoSelecionado(null)}
              className="absolute top-4 right-4 bg-white/80 text-dark w-10 h-10 rounded-full flex justify-center items-center font-bold text-2xl shadow-sm z-10 hover:text-primary"
            >
              &times;
            </button>

            <div className="w-full h-[280px] bg-gray-50 flex justify-center items-center p-8">

              <img
                src={imagemProduto(produtoSelecionado)}
                alt={produtoSelecionado.nome}
                className="w-full h-full object-contain drop-shadow-xl"
                onError={(e) => {
                  e.currentTarget.src =
                    '/assets/images/logo.png';
                }}
              />

            </div>

            <div className="p-6">

              <h2 className="text-3xl font-black text-dark mb-1 leading-tight">
                {produtoSelecionado.nome}
              </h2>

              <p className="text-2xl font-black text-primary mb-4">
                {formatarPreco(produtoSelecionado.preco)}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  {produtoSelecionado.descricao ||
                    'Delicioso produto da Scoop Sorveteria.'}
                </p>
              </div>

              <button
                onClick={() => {
                  adicionarItem(produtoSelecionado);
                  setProdutoSelecionado(null);
                }}
                className="w-full bg-primary text-white py-4 rounded-xl text-[17px] font-extrabold shadow-md active:scale-95 transition-all"
              >
                Adicionar ao Pedido
              </button>

            </div>

          </div>

        </div>
      )}

      {/* RESUMO DO CARRINHO */}
      {carrinho.length > 0 && (
        <div
          className="fixed bottom-0 left-0 w-full bg-primary text-white p-4 z-50 shadow-lg flex justify-between items-center cursor-pointer"
          onClick={() => setCarrinhoAberto(true)}
        >

          <div>
            <p className="text-sm font-medium">
              Resumo do Pedido
            </p>

            <p className="text-xl font-bold">
              Total: {formatarPreco(calcularTotal())}
            </p>
          </div>

          <button className="bg-white text-primary px-4 py-2 rounded-lg font-bold">
            Ver Carrinho
          </button>

        </div>
      )}

      {/* MODAL DO CARRINHO */}
      {carrinhoAberto && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end sm:justify-center items-center"
          onClick={() => setCarrinhoAberto(false)}
        >

          <div
            className="bg-white w-full sm:w-[500px] h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="p-5 border-b flex justify-between items-center">

              <h2 className="text-2xl font-bold text-dark">
                Seu Carrinho
              </h2>

              <button
                onClick={() => setCarrinhoAberto(false)}
                className="text-3xl font-bold text-gray-400 hover:text-dark"
              >
                &times;
              </button>

            </div>

            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">

              {carrinho.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-4"
                >

                  <div className="flex-1">

                    <h4 className="font-bold text-dark">
                      {item.nome}
                    </h4>

                    <p className="text-primary font-bold">
                      {formatarPreco(
                        item.preco * item.quantidade
                      )}
                    </p>

                  </div>

                  <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-xl">

                    <button
                      onClick={() =>
                        mudarQuantidade(item.id, -1)
                      }
                      className="w-8 h-8 bg-white rounded-lg font-bold"
                    >
                      -
                    </button>

                    <span className="font-bold">
                      {item.quantidade}
                    </span>

                    <button
                      onClick={() =>
                        mudarQuantidade(item.id, 1)
                      }
                      className="w-8 h-8 bg-white rounded-lg font-bold"
                    >
                      +
                    </button>

                  </div>

                </div>
              ))}

            </div>

            <div className="p-5 border-t bg-gray-50">

              <input
                type="text"
                value={clienteNome}
                onChange={(e) =>
                  setClienteNome(e.target.value)
                }
                placeholder="Seu Nome Completo"
                className="w-full mb-3 p-3 border border-gray-300 rounded-lg outline-none focus:border-primary"
              />

              <input
                type="text"
                value={clienteEndereco}
                onChange={(e) =>
                  setClienteEndereco(e.target.value)
                }
                placeholder="Endereço de Entrega (Rua, Número, Bairro)"
                className="w-full mb-4 p-3 border border-gray-300 rounded-lg outline-none focus:border-primary"
              />

              <div className="flex justify-between items-center mb-4">

                <span className="text-lg font-bold">
                  Total do Pedido:
                </span>

                <span className="text-2xl font-black text-primary">
                  {formatarPreco(calcularTotal())}
                </span>

              </div>

              <button
                onClick={fecharPedido}
                disabled={enviandoPedido}
                className="w-full bg-primary text-white py-3 rounded-xl text-lg font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {enviandoPedido
                  ? 'Enviando...'
                  : 'Fechar Pedido'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;