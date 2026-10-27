import { TestBed } from '@angular/core/testing';
import { DadosTarefa } from '../../models/tarefa';
import { paraDataLocal, sugerirPrazo } from '../../utils/datas';
import { TarefaFormComponent } from './tarefa-form.component';

describe('TarefaFormComponent', () => {
  /** Cria o formulário (vazio = tarefa nova) e guarda tudo o que ele enviar. */
  function montar(inicial: DadosTarefa | null = null) {
    const fixture = TestBed.createComponent(TarefaFormComponent);
    fixture.componentRef.setInput('inicial', inicial);
    fixture.detectChanges();
    const form = fixture.componentInstance;
    const enviados: DadosTarefa[] = [];
    form.salvar.subscribe((dados) => enviados.push(dados));
    const botao = () => fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;
    return { fixture, form, enviados, botao };
  }

  it('começa com o prazo sugerido e o botão desativado até ter título', () => {
    const { fixture, form, botao } = montar();
    const sugestao = sugerirPrazo(new Date());

    expect(form.data()).toBe(sugestao.data);
    expect(form.hora()).toBe(sugestao.hora);
    expect(botao().disabled).toBe(true);

    form.titulo.set('Nova tarefa');
    fixture.detectChanges();
    expect(botao().disabled).toBe(false);
  });

  it('vem preenchido com a tarefa em edição', () => {
    const { form } = montar({
      titulo: 'Relatório',
      categoria: 'Estudo',
      prioridade: 'Baixa',
      prazo: '2026-11-10T08:30',
      notas: 'Capítulo 2',
    });
    expect([form.titulo(), form.categoria(), form.prioridade(), form.data(), form.hora(), form.notas()]).toEqual([
      'Relatório',
      'Estudo',
      'Baixa',
      '2026-11-10',
      '08:30',
      'Capítulo 2',
    ]);
  });

  it('envia os dados limpos e com o prazo montado', () => {
    const { form, enviados } = montar();
    form.titulo.set('  Estudar  ');
    form.notas.set('   ');
    form.categoria.set('Estudo');
    form.prioridade.set('Média');
    form.data.set('2026-11-10');
    form.hora.set('14:00');

    form.enviar();

    expect(enviados).toEqual([
      { titulo: 'Estudar', notas: undefined, categoria: 'Estudo', prioridade: 'Média', prazo: '2026-11-10T14:00' },
    ]);
  });

  it('não envia sem título', () => {
    const { form, enviados } = montar();
    form.titulo.set('   ');
    form.enviar();
    expect(enviados).toEqual([]);
  });

  it('os atalhos Hoje e Amanhã mudam a data, e "Sem prazo" tira a data e a hora', () => {
    const { form, enviados } = montar();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    form.usarAtalho('amanha');
    expect(form.data()).toBe(paraDataLocal(amanha));
    expect(form.atalhoAtivo()).toBe('amanha');

    form.usarAtalho('hoje');
    expect(form.atalhoAtivo()).toBe('hoje');

    form.usarAtalho('sem-prazo');
    expect(form.atalhoAtivo()).toBe('sem-prazo');
    form.titulo.set('Ler');
    form.enviar();
    expect(enviados[0].prazo).toBeUndefined();
  });

  it('envia ao tocar no botão do formulário', () => {
    const { fixture, form, enviados, botao } = montar();
    form.titulo.set('Pelo botão');
    fixture.detectChanges();

    botao().click();

    expect(enviados.map((d) => d.titulo)).toEqual(['Pelo botão']);
  });
});
