import {
  diferencaEmDias,
  estaAtrasada,
  formatarDataCabecalho,
  formatarDataCompleta,
  formatarPrazo,
  lerPrazo,
  montarPrazo,
  separarPrazo,
  sugerirPrazo,
} from './datas';

// Segunda-feira, 26/10/2026, 10:30 no horário local
const AGORA = new Date(2026, 9, 26, 10, 30);

describe('datas', () => {
  it('monta o prazo com e sem hora', () => {
    expect(montarPrazo('2026-10-26', '14:00')).toBe('2026-10-26T14:00');
    expect(montarPrazo('2026-10-26', '')).toBe('2026-10-26');
    expect(montarPrazo('', '14:00')).toBeUndefined();
  });

  it('separa o prazo nos campos de data e hora', () => {
    expect(separarPrazo('2026-10-26T14:00')).toEqual({ data: '2026-10-26', hora: '14:00' });
    expect(separarPrazo('2026-10-26')).toEqual({ data: '2026-10-26', hora: '' });
    expect(separarPrazo(undefined)).toEqual({ data: '', hora: '' });
  });

  it('considera um prazo sem hora válido até o fim do dia', () => {
    expect(lerPrazo('2026-10-26')).toEqual(new Date(2026, 9, 26, 23, 59));
    expect(lerPrazo('Hoje, 14:00')).toBeNull();
  });

  it('formata o prazo em relação a hoje', () => {
    expect(formatarPrazo('2026-10-26T14:00', AGORA)).toBe('Hoje, 14:00');
    expect(formatarPrazo('2026-10-27', AGORA)).toBe('Amanhã');
    expect(formatarPrazo('2026-10-25T18:00', AGORA)).toBe('Ontem, 18:00');
    expect(formatarPrazo('2026-10-30T10:00', AGORA)).toBe('Sex, 10:00');
    expect(formatarPrazo('2026-11-12', AGORA)).toBe('12 nov');
    expect(formatarPrazo('2027-02-03', AGORA)).toBe('3 fev 2027');
    expect(formatarPrazo(undefined, AGORA)).toBe('Sem prazo');
  });

  it('identifica prazos vencidos', () => {
    expect(estaAtrasada('2026-10-26T09:00', AGORA)).toBe(true);
    expect(estaAtrasada('2026-10-26T11:00', AGORA)).toBe(false);
    expect(estaAtrasada('2026-10-26', AGORA)).toBe(false);
    expect(estaAtrasada('2026-10-25', AGORA)).toBe(true);
    expect(estaAtrasada(undefined, AGORA)).toBe(false);
  });

  it('conta dias de calendário, não períodos de 24 horas', () => {
    expect(diferencaEmDias(new Date(2026, 9, 26, 23, 0), new Date(2026, 9, 27, 1, 0))).toBe(1);
    expect(diferencaEmDias(new Date(2026, 11, 31), new Date(2027, 0, 1))).toBe(1);
  });

  it('formata as datas exibidas na tela', () => {
    expect(formatarDataCabecalho(AGORA)).toBe('Segunda, 26 de outubro');
    expect(formatarDataCompleta(new Date(2026, 9, 20, 12).toISOString())).toBe('20 de outubro de 2026');
    expect(formatarDataCompleta('inválida')).toBe('—');
  });

  it('sugere a próxima hora cheia como prazo, ou amanhã cedo à noite', () => {
    expect(sugerirPrazo(AGORA)).toEqual({ data: '2026-10-26', hora: '11:00' });
    expect(sugerirPrazo(new Date(2026, 9, 26, 22, 51))).toEqual({ data: '2026-10-26', hora: '23:00' });
    expect(sugerirPrazo(new Date(2026, 9, 26, 23, 15))).toEqual({ data: '2026-10-27', hora: '09:00' });
  });
});
