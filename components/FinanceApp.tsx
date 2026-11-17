'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, ChartNoAxesCombined,
  Check, ChevronLeft, ChevronRight, CircleAlert, CreditCard, Download, FolderPlus,
  LayoutDashboard, LogOut, Menu, Moon, Sun, Pencil, Plus, Search, ShieldCheck, Trash2, Wallet, X, PiggyBank
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip } from 'recharts';
import { supabaseClient, isConfigured } from '@/lib/supabase';
import {
  addMonths, currency, dateLabel, dateNow, DEFAULT_CATEGORIES, formatInputMoney,
  monthLabel, monthNow, parseMoney, splitInstallments, type Category, type Kind, type Transaction
} from '@/lib/finance';
import { salaryForMonth, salaryDate, virtualSalary, type SalaryPlan } from '@/lib/salary';

type Section = 'dashboard' | 'transactions' | 'installments' | 'categories' | 'planning';
type EntryForm = { title: string; amount: string; type: Kind; category_id: string; due_date: string; paid: boolean; notes: string; installments: number };
const initialForm = (type: Kind = 'expense'): EntryForm => ({ title: '', amount: '', type, category_id: '', due_date: dateNow(), paid: false, notes: '', installments: 1 });
const iconSize = 18;
const navigation: { id: Section; name: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', name: 'Visão geral', icon: LayoutDashboard },
  { id: 'transactions', name: 'Movimentações', icon: ArrowUpRight },
  { id: 'installments', name: 'Parcelamentos', icon: CreditCard },
  { id: 'categories', name: 'Categorias', icon: FolderPlus },
  { id: 'planning', name: 'Planejamento', icon: PiggyBank },
];

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const saved = window.localStorage.getItem('zentro-theme');
    const preferred = saved === 'dark' || saved === 'light' ? saved : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
    document.documentElement.classList.toggle('dark', preferred === 'dark');
    document.documentElement.style.colorScheme = preferred;
  }, []);
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    window.localStorage.setItem('zentro-theme', next);
  };
  return <button type="button" className="theme-toggle" onClick={toggle} title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'} aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}>
    {theme === 'light' ? <Moon size={19}/> : <Sun size={19}/>}
  </button>;
}

function Logo() {
  return <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-emerald-500 text-[#062D23] flex items-center justify-center shadow-sm"><span className="text-[25px] font-black tracking-tight">Z</span></div>
    <div><div className="text-[23px] font-extrabold tracking-tight leading-none">zentro<span className="text-emerald-500">.</span></div><div className="text-[10px] font-semibold tracking-[.13em] text-slate-400 mt-1">SUAS FINANÇAS EM UM SÓ LUGAR</div></div></div>;
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="text-center py-14 px-6"><div className="rounded-2xl bg-slate-100 text-slate-400 w-14 h-14 flex items-center justify-center mx-auto mb-4"><Wallet size={24}/></div><div className="font-bold text-slate-700">{title}</div><p className="text-sm mt-2 text-slate-400 max-w-sm mx-auto">{detail}</p></div>;
}

function AuthScreen({ onMessage }: { onMessage: (message:string) => void }) {
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setInfo('');
    try {
      const sb = supabaseClient();
      const response = mode === 'login'
        ? await sb.auth.signInWithPassword({ email: email.trim(), password })
        : await sb.auth.signUp({ email: email.trim(), password });
      if (response.error) throw response.error;
      if (mode === 'signup' && !response.data.session) setInfo('Conta criada! Confira seu e-mail para confirmar o cadastro antes de entrar.');
      if (mode === 'signup' && response.data.session) onMessage('Sua conta foi criada com sucesso!');
    } catch (err) { setInfo(err instanceof Error ? err.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen grid lg:grid-cols-2 auth-shell">
    <div className="hidden lg:flex flex-col justify-between p-12 xl:p-20 bg-[#0F172A] text-white relative overflow-hidden">
      <div className="absolute -right-40 top-20 w-[550px] h-[550px] rounded-full border-[85px] border-white/5"/>
      <div className="absolute -left-20 bottom-[-200px] w-[550px] h-[550px] rounded-full bg-emerald-500/10"/>
      <div className="relative"><div className="flex items-center gap-3"><div className="rounded-2xl bg-white p-2 text-emerald-600"><span className="text-2xl font-black">Z</span></div><span className="text-3xl font-extrabold tracking-tight">zentro.</span></div></div>
      <div className="relative max-w-xl"><div className="inline-block bg-emerald-400/15 px-4 py-2 rounded-full text-sm text-emerald-100 mb-8">Bem-vindo ao Zentro</div><h1 className="text-5xl xl:text-6xl leading-[1.13] font-extrabold tracking-tight">Suas finanças em um só lugar.</h1><p className="text-lg text-emerald-100/75 mt-7 leading-relaxed">Registre seus gastos, acompanhe seus parcelamentos e veja suas finanças de um jeito simples — sem planilhas complicadas.</p></div>
      <div className="relative text-sm text-emerald-200/60">Suas finanças em um só lugar.</div>
    </div>
    <div className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-[420px]">
      <div className="flex justify-between items-center mb-12"><div className="lg:hidden"><Logo/></div><div className="ml-auto"><ThemeToggle/></div></div>
      <div className="text-[13px] font-bold text-emerald-600 mb-4">BEM-VINDO AO ZENTRO</div>
      <h2 className="text-3xl font-extrabold tracking-tight">{mode==='login'?'Acesse sua conta':'Crie sua conta'}</h2>
      <p className="text-slate-500 mt-3 mb-9 text-sm">{mode==='login'?'Continue de onde parou. Suas finanças estão aqui.':'Comece a controlar suas finanças com facilidade.'}</p>
      <form onSubmit={submit} className="space-y-5">
        <div><label className="label" htmlFor="email">E-mail</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seuemail@exemplo.com"/></div>
        <div><label className="label" htmlFor="password">Senha</label><input id="password" className="input" type="password" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></div>
        {info && <div className="rounded-xl bg-emerald-50 text-emerald-800 text-sm p-3">{info}</div>}
        <button disabled={busy} className="btn-primary w-full !py-3">{busy?'Processando...':mode==='login'?'Entrar na minha conta':'Criar conta'} <ArrowRight size={16}/></button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-7">{mode==='login'?'Ainda não tem conta?':'Já tem uma conta?'} <button className="text-emerald-600 font-bold" onClick={()=>{setMode(mode==='login'?'signup':'login');setInfo('');}}>{mode==='login'?'Cadastre-se':'Entrar'}</button></p>
      <p className="text-center text-xs text-slate-400 mt-14 flex items-center justify-center gap-2"><ShieldCheck size={14}/> Dados protegidos por autenticação e regras de acesso.</p>
    </div></div>
  </div>;
}

function EntryModal({ categories, initial, defaultType, onClose, onSave, busy }: {
  categories: Category[]; initial: Transaction | null; defaultType: Kind; onClose: () => void;
  onSave: (form:EntryForm) => Promise<void>; busy: boolean;
}) {
  const [form,setForm] = useState<EntryForm>(()=>initial ? ({
    title: initial.title, amount: formatInputMoney(initial.amount_cents), type: initial.type,
    category_id: initial.category_id || '', due_date: initial.due_date, paid: initial.paid,
    notes: initial.notes || '', installments: 1
  }) : initialForm(defaultType));
  const set = <K extends keyof EntryForm>(key:K, value:EntryForm[K])=>setForm(prev=>({...prev,[key]:value,...(key==='type'?{category_id:'',installments:1}:{})}));
  const cents = parseMoney(form.amount);
  const valid = !!form.title.trim() && Number.isSafeInteger(cents) && cents >= form.installments && !!/^\d{4}-\d{2}-\d{2}$/.test(form.due_date);
  const parts = valid && form.installments>1 ? splitInstallments(cents,form.installments) : [];
  return <div className="modal-backdrop" onMouseDown={e=>{ if(e.target===e.currentTarget && !busy) onClose(); }}><div className="modal">
    <div className="flex items-center justify-between mb-6"><div><h2 className="text-xl font-extrabold">{initial?'Editar lançamento':'Novo lançamento'}</h2><p className="text-xs text-slate-400 mt-1">{initial?'Altere os dados deste lançamento.':'Preencha os campos abaixo para registrar.'}</p></div><button className="p-2 rounded-lg hover:bg-slate-100" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div>
    <form onSubmit={async e=>{e.preventDefault();if(valid) await onSave(form);}} className="space-y-4">
      <div className="flex gap-2 rounded-xl bg-slate-100 p-1">{(['expense','income'] as Kind[]).map(type=><button key={type} type="button" disabled={!!initial && type!==initial.type} onClick={()=>set('type',type)} className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${form.type===type?'bg-white shadow-sm text-emerald-700':'text-slate-500'}`}>{type==='expense'?'Despesa':'Receita'}</button>)}</div>
      <div><label className="label">Descrição *</label><input className="input" maxLength={160} placeholder="Ex.: Supermercado, salário, notebook..." value={form.title} onChange={e=>set('title',e.target.value)} required/></div>
      <div className="grid sm:grid-cols-2 gap-4"><div><label className="label">{form.installments>1?'Valor total da compra *':'Valor (R$) *'}</label><input className="input" inputMode="decimal" placeholder="Ex.: 250,00" value={form.amount} onChange={e=>set('amount',e.target.value)} required/></div>
      <div><label className="label">Categoria</label><select className="input" value={form.category_id} onChange={e=>set('category_id',e.target.value)}><option value="">Sem categoria</option>{categories.filter(c=>c.type===form.type).map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div></div>
      <div className="grid sm:grid-cols-2 gap-4"><div><label className="label">{form.installments>1?'Data da 1ª parcela *':'Data de vencimento *'}</label><input className="input" type="date" required value={form.due_date} onChange={e=>set('due_date',e.target.value)}/></div>
      {!initial && form.type==='expense' && <div><label className="label">Número de parcelas</label><select className="input" value={form.installments} onChange={e=>set('installments',Number(e.target.value))}>{Array.from({length:60},(_,i)=>i+1).map(n=><option key={n} value={n}>{n===1?'À vista':`${n}x`}</option>)}</select></div>}</div>
      {form.installments>1 && valid && <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm"><div className="font-bold text-blue-900">{form.installments} parcelas de aproximadamente {currency(parts[0])}</div><div className="text-emerald-700 mt-1">Primeira: {dateLabel(form.due_date)} · Última: {dateLabel(addMonths(form.due_date, form.installments-1))}</div><div className="text-xs text-emerald-600 mt-1">A diferença de centavos será distribuída automaticamente.</div></div>}
      <div><label className="label">Observações (opcional)</label><textarea className="input min-h-[70px]" maxLength={1000} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Alguma informação adicional?"/></div>
      <label className="flex gap-3 items-center text-sm text-slate-600"><input type="checkbox" checked={form.paid} onChange={e=>set('paid',e.target.checked)} className="h-4 w-4 accent-blue-600"/>{form.type==='income'?'Já recebi esse valor':'Já paguei'}{form.installments>1?' (marcar a primeira parcela como paga)':''}</label>
      {initial?.group_id && <div className="rounded-xl bg-amber-50 text-amber-800 text-xs p-3">Este lançamento é uma parcela. A edição altera somente esta parcela, não as demais.</div>}
      <div className="flex justify-end gap-2 pt-3"><button type="button" className="btn-outline" disabled={busy} onClick={onClose}>Cancelar</button><button disabled={!valid||busy} className="btn-primary" type="submit">{busy?'Salvando...':initial?'Salvar alterações':'Adicionar lançamento'}</button></div>
    </form></div></div>;
}

export default function FinanceApp() {
  const [user,setUser] = useState<User|null>(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [toast,setToast] = useState('');
  const [section,setSection] = useState<Section>('dashboard');
  const [month,setMonth] = useState(monthNow());
  const [transactions,setTransactions] = useState<Transaction[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [salaryPlans,setSalaryPlans] = useState<SalaryPlan[]>([]);
  const [salaryInput,setSalaryInput] = useState('');
  const [salaryDay,setSalaryDay] = useState(5);
  const [salaryEffective,setSalaryEffective] = useState(monthNow());
  const [salaryEnabled,setSalaryEnabled] = useState(true);
  const [entryOpen,setEntryOpen] = useState(false);
  const [editing,setEditing] = useState<Transaction|null>(null);
  const [defaultType,setDefaultType] = useState<Kind>('expense');
  const [mobileMenu,setMobileMenu] = useState(false);
  const [filterType,setFilterType] = useState<'all'|Kind>('all');
  const [query,setQuery] = useState('');
  const [catName,setCatName] = useState('');
  const [catType,setCatType] = useState<Kind>('expense');
  const [catColor,setCatColor] = useState('#10b981');

  useEffect(()=>{
    if (!isConfigured()) {setAuthLoading(false);return;}
    const sb=supabaseClient();
    sb.auth.getUser().then(({data,error:authError})=>{setUser(authError?null:data.user);setAuthLoading(false);});
    const {data:{subscription}}=sb.auth.onAuthStateChange((_event,session)=>{setUser(session?.user??null);setAuthLoading(false);});
    return ()=>subscription.unsubscribe();
  },[]);

  const reload = useCallback(async(userId:string)=>{
    setLoading(true);setError('');
    try {
      const sb=supabaseClient();
      const [cats,trans,plans]=await Promise.all([
        sb.from('categories').select('*').eq('user_id',userId).order('name'),
        sb.from('transactions').select('*').eq('user_id',userId).order('due_date',{ascending:false}).limit(10000),
        sb.from('salary_plans').select('*').eq('user_id',userId).order('effective_month',{ascending:false})
      ]);
      if(cats.error) throw cats.error;
      if(trans.error) throw trans.error;
      if(plans.error) throw new Error('A atualização do banco para Planejamento ainda não foi executada. Execute supabase/upgrade-planejamento.sql no SQL Editor. Detalhes: '+plans.error.message);
      let categoryList=(cats.data??[]) as Category[];
      if(categoryList.length===0){
        const seed=await sb.from('categories').upsert(DEFAULT_CATEGORIES.map(c=>({...c,user_id:userId})),{onConflict:'user_id,type,name',ignoreDuplicates:true}).select('*');
        if(seed.error) throw seed.error;
        const refreshed=await sb.from('categories').select('*').eq('user_id',userId).order('name');
        if(refreshed.error) throw refreshed.error;
        categoryList=(refreshed.data??[]) as Category[];
      }
      setCategories(categoryList);setTransactions((trans.data??[]) as Transaction[]);setSalaryPlans((plans.data??[]) as SalaryPlan[]);
    } catch(e) {setError(e instanceof Error?e.message:'Falha ao carregar os dados.');}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{if(user) void reload(user.id);else {setTransactions([]);setCategories([]);setSalaryPlans([]);}},[user,reload]);

  const notify=(message:string)=>{setToast(message);};
  const catById=useMemo(()=>new Map(categories.map(c=>[c.id,c])),[categories]);
  const plannedSalary=useMemo(()=>salaryForMonth(salaryPlans,month),[salaryPlans,month]);
  const salaryPreview=useMemo(()=>user?virtualSalary(salaryPlans,transactions,month,user.id):null,[salaryPlans,transactions,month,user]);
  const thisMonth=useMemo(()=>[...transactions.filter(t=>t.due_date.slice(0,7)===month),...(salaryPreview?[salaryPreview]:[])],[transactions,month,salaryPreview]);
  const income=thisMonth.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount_cents,0);
  const expenses=thisMonth.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount_cents,0);
  const pending=thisMonth.filter(t=>t.type==='expense'&&!t.paid).reduce((a,t)=>a+t.amount_cents,0);
  const incomeReceived=thisMonth.filter(t=>t.type==='income'&&t.paid).reduce((a,t)=>a+t.amount_cents,0);
  const expensePaid=thisMonth.filter(t=>t.type==='expense'&&t.paid).reduce((a,t)=>a+t.amount_cents,0);
  const chartData=useMemo(()=>{
    const grouped = new Map<string,{name:string;value:number;color:string}>();
    for(const t of thisMonth.filter(t=>t.type==='expense')){
      const cat=t.category_id?catById.get(t.category_id):undefined;
      const name=cat?.name||'Sem categoria';const previous=grouped.get(name);
      grouped.set(name,{name,value:(previous?.value||0)+t.amount_cents,color:cat?.color||'#94a3b8'});
    }
    return Array.from(grouped.values()).sort((a,b)=>b.value-a.value);
  },[thisMonth,catById]);
  const filtered=useMemo(()=>thisMonth.filter(t=>(filterType==='all'||t.type===filterType)&&t.title.toLowerCase().includes(query.toLowerCase().trim())),[thisMonth,filterType,query]);
  const groups=useMemo(()=>{
    const map=new Map<string,Transaction[]>();
    transactions.filter(t=>t.group_id).forEach(t=>{const id=t.group_id!;map.set(id,[...(map.get(id)||[]),t]);});
    return [...map.entries()].map(([id,items])=>({id,items:items.sort((a,b)=>(a.installment_number??0)-(b.installment_number??0))})).sort((a,b)=>b.items[0].due_date.localeCompare(a.items[0].due_date));
  },[transactions]);

  const saveEntry=async(form:EntryForm)=>{
    if(!user) return;
    const cents=parseMoney(form.amount);
    if(!Number.isSafeInteger(cents)||cents<form.installments) {setError('Informe um valor válido: cada parcela precisa ter pelo menos R$ 0,01.');return;}
    setBusy(true);setError('');
    try {
      const sb=supabaseClient();
      if(editing){
        const {error:dbError}=await sb.from('transactions').update({title:form.title.trim(),amount_cents:cents,type:form.type,category_id:form.category_id||null,due_date:form.due_date,paid:form.paid,notes:form.notes.trim()||null}).eq('id',editing.id).eq('user_id',user.id);
        if(dbError) throw dbError;
      }else{
        const n=form.type==='expense'?form.installments:1;
        const amounts=splitInstallments(cents,n);
        const groupId=n>1?crypto.randomUUID():null;
        const payload=amounts.map((amount,i)=>({user_id:user.id,title:form.title.trim(),amount_cents:amount,type:form.type,category_id:form.category_id||null,due_date:addMonths(form.due_date,i),paid:i===0?form.paid:false,notes:form.notes.trim()||null,group_id:groupId,installment_number:groupId?i+1:null,installment_count:groupId?n:null}));
        const {error:dbError}=await sb.from('transactions').insert(payload);
        if(dbError) throw dbError;
      }
      setEntryOpen(false);setEditing(null);notify(editing?'Lançamento atualizado!':'Lançamento salvo com sucesso!');await reload(user.id);
    }catch(e){setError(e instanceof Error?e.message:'Erro ao salvar.');}
    finally{setBusy(false);}
  };
  const togglePaid=async(t:Transaction)=>{
    if(!user)return;
    if(t.id.startsWith('salary-preview:')){
      setBusy(true);setError('');
      try {
        const {error:dbError}=await supabaseClient().from('transactions').insert({
          user_id:user.id,title:t.title,amount_cents:t.amount_cents,type:'income',
          category_id:categories.find(c=>c.type==='income'&&c.name==='Salário')?.id??null,
          due_date:t.due_date,paid:true,notes:'Salário recorrente confirmado',salary_month:t.salary_month
        });
        if(dbError) throw dbError;
        notify('Salário confirmado como recebido!');await reload(user.id);
      }catch(e){setError(e instanceof Error?e.message:'Falha ao confirmar o salário.');}
      finally{setBusy(false);}
      return;
    }
    const {error:dbError}=await supabaseClient().from('transactions').update({paid:!t.paid}).eq('id',t.id).eq('user_id',user.id);
    if(dbError){setError(dbError.message);return;} await reload(user.id);
  };
  const deleteEntry=async(t:Transaction)=>{
    if(!user||!window.confirm(`Excluir ${t.group_id?'esta parcela':'o lançamento'} "${t.title}"?`))return;
    const {error:dbError}=await supabaseClient().from('transactions').delete().eq('id',t.id).eq('user_id',user.id);
    if(dbError){setError(dbError.message);return;}notify('Lançamento excluído.');await reload(user.id);
  };
  const deleteGroup=async(groupId:string,title:string)=>{
    if(!user||!window.confirm(`Excluir TODAS as parcelas da compra "${title}"? Essa ação não pode ser desfeita.`))return;
    const {error:dbError}=await supabaseClient().from('transactions').delete().eq('group_id',groupId).eq('user_id',user.id);
    if(dbError){setError(dbError.message);return;}notify('Compra parcelada excluída.');await reload(user.id);
  };
  const saveSalary=async(e:React.FormEvent)=>{
    e.preventDefault();if(!user)return;
    const cents=parseMoney(salaryInput);
    if(!Number.isSafeInteger(cents)||cents<=0){setError('Informe um salário mensal válido.');return;}
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(salaryEffective)){setError('Selecione um mês válido.');return;}
    if(!Number.isInteger(salaryDay)||salaryDay<1||salaryDay>31){setError('Dia do recebimento inválido.');return;}
    setBusy(true);setError('');
    try {
      const {error:dbError}=await supabaseClient().from('salary_plans').upsert({
        user_id:user.id,effective_month:`${salaryEffective}-01`,amount_cents:cents,
        payment_day:salaryDay,enabled:salaryEnabled
      },{onConflict:'user_id,effective_month'});
      if(dbError) throw dbError;
      notify('Planejamento de renda salvo!');await reload(user.id);
    }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar renda.');}
    finally{setBusy(false);}
  };
  const openPlanning=()=>{
    const plan=salaryForMonth(salaryPlans,month);
    setSalaryInput(plan?formatInputMoney(plan.amount_cents):'');
    setSalaryDay(plan?.payment_day??5);
    setSalaryEnabled(plan?.enabled??true);
    setSalaryEffective(month);
    setSection('planning');setMobileMenu(false);
  };
  const createCategory=async(e:React.FormEvent)=>{
    e.preventDefault();if(!user||!catName.trim())return;
    setBusy(true);setError('');
    const {error:dbError}=await supabaseClient().from('categories').insert({name:catName.trim(),type:catType,color:catColor,user_id:user.id});
    setBusy(false);if(dbError){setError(dbError.code==='23505'?'Essa categoria já existe.':dbError.message);return;}
    setCatName('');notify('Categoria adicionada!');await reload(user.id);
  };
  const deleteCategory=async(c:Category)=>{
    if(!user||!window.confirm(`Excluir categoria "${c.name}"?`))return;
    const {error:dbError}=await supabaseClient().from('categories').delete().eq('id',c.id).eq('user_id',user.id);
    if(dbError){setError('Não é possível excluir uma categoria usada em lançamentos.');return;}
    notify('Categoria excluída!');await reload(user.id);
  };
  const exportCSV=()=>{
    const rows=[['Descrição','Tipo','Categoria','Valor (R$)','Vencimento','Status','Parcela','Observações'],...filtered.map(t=>[
      t.title,t.type==='income'?'Receita':'Despesa',catById.get(t.category_id||'')?.name||'',formatInputMoney(t.amount_cents),dateLabel(t.due_date),t.paid?'Pago/recebido':'Pendente',t.installment_number?`${t.installment_number}/${t.installment_count}`:'',t.notes||''
    ])];
    const data='\ufeff'+rows.map(r=>r.map(v=>{const text=String(v);const safe=/^[=+@\-\t\r]/.test(text)?'\''+text:text;return '"'+safe.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');
    const blob=new Blob([data],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`zentro-movimentacoes-${month}.csv`;a.click();URL.revokeObjectURL(url);
  };
  const openEntry=(type:Kind='expense',t:Transaction|null=null)=>{setEditing(t);setDefaultType(type);setEntryOpen(true);};
  const shiftMonth=(delta:number)=>setMonth(current=>addMonths(`${current}-01`,delta).slice(0,7));

  if(!isConfigured())return <div className="min-h-screen flex items-center justify-center p-5 bg-slate-50"><div className="card p-8 max-w-xl w-full"><div className="flex items-center justify-between"><Logo/><ThemeToggle/></div><h1 className="text-2xl font-extrabold mt-8">Configuração inicial necessária</h1><p className="text-sm text-slate-600 mt-3 leading-relaxed">O site está instalado, mas falta conectar ao Supabase. Copie <code>.env.example</code> para <code>.env.local</code>, coloque a URL e a chave pública do seu projeto e execute o SQL de <code>supabase/schema.sql</code>.</p><p className="text-sm mt-3 text-emerald-700">Veja as instruções detalhadas no arquivo README.md.</p></div></div>;
  if(authLoading)return <div className="min-h-screen flex justify-center items-center text-slate-500">Carregando Zentro...</div>;
  if(!user)return <AuthScreen onMessage={notify}/>;

  const name=user.email?.split('@')[0]||'você';
  const renderTable=(rows:Transaction[])=> <div className="table-wrap"><table className="finance-table"><thead><tr><th>Descrição</th><th>Vencimento</th><th>Categoria</th><th>Status</th><th>Valor</th><th>Ações</th></tr></thead><tbody>
    {rows.map(t=>{const cat=t.category_id?catById.get(t.category_id):undefined;return <tr key={t.id}>
      <td><div className="font-bold text-slate-700 flex items-center gap-2"><span className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type==='income'?'bg-emerald-50 text-emerald-600':'bg-rose-50 text-rose-500'}`}>{t.type==='income'?<ArrowDownLeft size={16}/>:<ArrowUpRight size={16}/>}</span><div><div>{t.title}{t.id.startsWith('salary-preview:')&&<span className="ml-2 text-xs text-emerald-600 font-medium">(previsto)</span>}</div>{t.group_id&&<div className="text-[11px] font-normal text-slate-400">Parcela {t.installment_number}/{t.installment_count}</div>}</div></div></td>
      <td className="text-slate-500 whitespace-nowrap">{dateLabel(t.due_date)}</td>
      <td><div className="inline-flex items-center gap-2 text-slate-600"><span className="w-2 h-2 rounded-full" style={{background:cat?.color||'#94a3b8'}}/>{cat?.name||'Sem categoria'}</div></td>
      <td><button disabled={busy} title={t.id.startsWith('salary-preview:')?'Confirmar recebimento do salário':'Clique para alternar o status'} onClick={()=>void togglePaid(t)} className={`pill ${t.paid?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{t.paid?<Check size={12}/>:<CircleAlert size={12}/>} {t.paid?(t.type==='income'?'Recebido':'Pago'):'Pendente'}</button></td>
      <td className={`whitespace-nowrap font-bold ${t.type==='income'?'text-emerald-600':'text-rose-600'}`}>{t.type==='income'?'+':'−'} {currency(t.amount_cents)}</td>
      <td><div className="flex items-center gap-1">{!t.id.startsWith('salary-preview:')&&<><button aria-label="Editar" title="Editar" className="p-2 text-slate-400 hover:text-emerald-600" onClick={()=>openEntry(t.type,t)}><Pencil size={15}/></button><button aria-label="Excluir" title="Excluir" className="p-2 text-slate-400 hover:text-rose-600" onClick={()=>void deleteEntry(t)}><Trash2 size={15}/></button></>}</div></td>
    </tr>})}
  </tbody></table></div>;

  return <div className="min-h-screen flex">
    {mobileMenu&&<div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={()=>setMobileMenu(false)}/>}
    <aside className={`fixed z-40 inset-y-0 left-0 w-[255px] bg-white border-r border-slate-100 flex flex-col px-4 py-7 transition-transform md:translate-x-0 ${mobileMenu?'translate-x-0':'-translate-x-full'}`}>
      <div className="px-4 mb-14"><Logo/></div>
      <div className="text-[11px] font-bold tracking-[.14em] text-slate-400 px-4 mb-4">MENU PRINCIPAL</div>
      <nav className="space-y-1">{navigation.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{if(item.id==='planning')openPlanning();else{setSection(item.id);setMobileMenu(false);}}} className={`w-full rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-bold text-left ${section===item.id?'bg-emerald-50 text-emerald-700':'text-slate-500 hover:bg-slate-50'}`}><Icon size={18}/>{item.name}</button>;})}</nav>
      <div className="mt-auto"><div className="bg-[#f3f7ff] rounded-2xl p-4 mb-6"><div className="text-emerald-700 font-bold text-sm">Organize com o Zentro ✨</div><p className="text-xs text-slate-500 mt-2 leading-relaxed">Suas finanças em um só lugar.</p></div><button onClick={async()=>{await supabaseClient().auth.signOut();}} className="flex items-center gap-3 text-slate-500 px-4 py-3 w-full text-sm font-semibold hover:text-rose-600"><LogOut size={18}/> Sair da conta</button></div>
    </aside>
    <main className="md:ml-[255px] flex-1 min-w-0">
      <header className="h-[78px] bg-white/90 border-b border-slate-100 px-5 lg:px-9 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md"><div className="flex items-center gap-3"><button aria-label="Abrir menu" className="p-2 md:hidden" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="font-bold text-slate-700">{navigation.find(n=>n.id===section)?.name}</div></div><div className="flex items-center gap-3"><ThemeToggle/><span className="hidden sm:block text-xs text-slate-400">Olá, <b className="text-slate-700">{name}</b></span><div className="bg-emerald-100 text-emerald-700 w-9 h-9 rounded-full flex items-center justify-center font-extrabold uppercase">{name[0]}</div></div></header>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-9 py-7 lg:py-9">
        {error&&<div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5 flex justify-between gap-4">{error}<button onClick={()=>setError('')} aria-label="Fechar aviso"><X size={16}/></button></div>}
        {toast&&<div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm mb-5 flex justify-between gap-4">{toast}<button onClick={()=>setToast('')} aria-label="Fechar aviso"><X size={16}/></button></div>}
        {loading&&<div className="text-emerald-600 text-xs font-semibold mb-3">Atualizando dados...</div>}
        {section==='dashboard'&& <>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-7"><div><p className="text-sm text-slate-400 font-medium mb-1">Suas finanças em um só lugar.</p><h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight">Resumo financeiro</h1></div><button onClick={()=>openEntry()} className="btn-primary"><Plus size={18}/> Novo lançamento</button></div>
          <div className="flex items-center gap-3 mb-6"><button className="btn-outline !p-2.5" onClick={()=>shiftMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={18}/></button><span className="font-bold capitalize min-w-[145px] text-center">{monthLabel(month)}</span><button className="btn-outline !p-2.5" onClick={()=>shiftMonth(1)} aria-label="Próximo mês"><ChevronRight size={18}/></button><button className="text-xs text-emerald-700 font-bold ml-2" onClick={()=>setMonth(monthNow())}>Mês atual</button></div>
          {!plannedSalary&&<div className="card p-4 mb-5 flex flex-wrap items-center justify-between gap-3"><div><b>Planeje seu salário mensal</b><p className="text-xs text-slate-500 mt-1">Defina o valor e o dia do recebimento para visualizar a renda prevista automaticamente.</p></div><button className="btn-primary" onClick={openPlanning}>Configurar salário</button></div>}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {[
              {label:'Saldo previsto do mês',value:income-expenses,icon:Wallet,color:'text-emerald-600',bg:'bg-emerald-50',detail:'Receitas − despesas previstas'},
              {label:'Receitas previstas',value:income,icon:ArrowDownLeft,color:'text-emerald-600',bg:'bg-emerald-50',detail:`Recebido: ${currency(incomeReceived)}`},
              {label:'Despesas previstas',value:expenses,icon:ArrowUpRight,color:'text-rose-600',bg:'bg-rose-50',detail:`Pago: ${currency(expensePaid)}`},
              {label:'Despesas pendentes',value:pending,icon:CalendarDays,color:'text-amber-600',bg:'bg-amber-50',detail:'Ainda não marcadas como pagas'}
            ].map((card,i)=>{const Icon=card.icon;return <div key={i} className="card p-5"><div className="flex items-center justify-between mb-5"><span className="text-xs text-slate-500 font-semibold">{card.label}</span><span className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}><Icon size={19}/></span></div><div className={`text-[25px] sm:text-[28px] font-extrabold tracking-tight ${i===0&&card.value<0?'text-rose-600':'text-slate-800'}`}>{currency(card.value)}</div><p className="text-[11px] text-slate-400 mt-2">{card.detail}</p></div>;})}
          </div>
          {plannedSalary?.enabled&&<div className="card p-5 mb-5 flex flex-wrap items-center justify-between gap-4"><div><b className="text-sm">Salário do mês: {currency(plannedSalary.amount_cents)}</b><p className="text-xs text-slate-500 mt-1">Previsto para {dateLabel(salaryDate(month,plannedSalary.payment_day))} · {salaryPreview?'Aguardando confirmação':'Lançamento confirmado ou registrado'}</p></div><button className="btn-outline" onClick={openPlanning}>Editar planejamento</button></div>}
          <div className="grid xl:grid-cols-[1.08fr_.92fr] gap-5 mb-6">
            <div className="card p-6 min-h-[340px]"><div className="flex items-start justify-between"><div><h2 className="text-base font-extrabold">Para onde vai o dinheiro?</h2><p className="text-xs text-slate-400 mt-1">Distribuição das despesas do mês</p></div><ChartNoAxesCombined size={19} className="text-slate-400"/></div>
              {chartData.length===0?<Empty title="Ainda não há despesas" detail="Adicione uma despesa para visualizar a distribuição por categoria."/>:<div className="flex flex-col sm:flex-row items-center gap-4 mt-3"><div className="h-[235px] w-full sm:w-[55%]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" innerRadius={70} outerRadius={102} paddingAngle={3} stroke="none">{chartData.map((c,i)=><Cell key={i} fill={c.color}/>)}</Pie><ChartTooltip formatter={(v)=>currency(Number(v))}/></PieChart></ResponsiveContainer></div><div className="flex-1 w-full space-y-3">{chartData.slice(0,7).map(c=><div key={c.name} className="flex justify-between gap-2 text-xs"><div className="flex items-center gap-2 text-slate-500"><span className="h-2.5 w-2.5 rounded-full" style={{background:c.color}}/>{c.name}</div><b className="text-slate-700">{currency(c.value)}</b></div>)}</div></div>}
            </div>
            <div className="card p-6 min-h-[340px]"><div className="flex items-start justify-between mb-5"><div><h2 className="text-base font-extrabold">Próximos pagamentos</h2><p className="text-xs text-slate-400 mt-1">Despesas ainda pendentes</p></div><CalendarDays size={19} className="text-slate-400"/></div>
              {transactions.filter(t=>t.type==='expense'&&!t.paid&&t.due_date>=dateNow()).length===0?<Empty title="Tudo em dia por aqui" detail="Não há pagamentos futuros pendentes cadastrados."/>:<div className="space-y-4">{transactions.filter(t=>t.type==='expense'&&!t.paid&&t.due_date>=dateNow()).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,5).map(t=><div key={t.id} className="flex items-center justify-between gap-3"><div className="flex gap-3 items-center min-w-0"><div className="w-10 h-10 shrink-0 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><CalendarDays size={17}/></div><div className="min-w-0"><div className="font-bold text-sm truncate">{t.title}</div><div className="text-xs text-slate-400 mt-1">{dateLabel(t.due_date)}{t.group_id?` · ${t.installment_number}/${t.installment_count}`:''}</div></div></div><b className="text-sm whitespace-nowrap">{currency(t.amount_cents)}</b></div>)}</div>}
            </div>
          </div>
          <div className="card overflow-hidden"><div className="flex justify-between items-center p-5 sm:p-6"><div><h2 className="font-extrabold">Últimas movimentações</h2><p className="text-xs text-slate-400 mt-1">Registros de {monthLabel(month)}</p></div><button className="text-xs font-bold text-emerald-600" onClick={()=>setSection('transactions')}>Ver todas →</button></div>{thisMonth.length?renderTable([...thisMonth].sort((a,b)=>b.due_date.localeCompare(a.due_date)).slice(0,6)):<Empty title="Nenhum lançamento neste mês" detail="Clique em Novo lançamento para começar seu controle financeiro."/>}</div>
          <p className="text-xs text-slate-400 mt-5">* O saldo previsto é uma projeção por vencimento, não o saldo real da sua conta bancária.</p>
        </>}
        {section==='transactions'&&<>
          <div className="flex flex-wrap justify-between gap-4 items-center mb-7"><div><h1 className="text-3xl font-extrabold tracking-tight">Movimentações</h1><p className="text-sm text-slate-400 mt-1">Consulte e gerencie suas receitas e despesas.</p></div><div className="flex gap-2"><button className="btn-outline" onClick={exportCSV}><Download size={16}/> Exportar CSV</button><button className="btn-primary" onClick={()=>openEntry()}><Plus size={17}/> Novo lançamento</button></div></div>
          <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end"><div className="flex-1 min-w-[190px]"><label className="label">Buscar lançamento</label><div className="relative"><Search size={16} className="absolute left-3.5 top-3.5 text-slate-400"/><input className="input !pl-10" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Descrição..."/></div></div><div><label className="label">Mês</label><input className="input" type="month" value={month} onChange={e=>setMonth(e.target.value)} /></div><div><label className="label">Tipo</label><select className="input" value={filterType} onChange={e=>setFilterType(e.target.value as 'all'|Kind)}><option value="all">Todos</option><option value="income">Receitas</option><option value="expense">Despesas</option></select></div></div>
          <div className="card overflow-hidden"><div className="flex justify-between p-5 border-b border-slate-100"><b className="text-sm">{filtered.length} lançamento(s)</b><span className="text-xs text-slate-400 capitalize">{monthLabel(month)}</span></div>{filtered.length?renderTable(filtered):<Empty title="Nenhum registro encontrado" detail="Ajuste os filtros ou adicione um novo lançamento."/>}</div>
        </>}
        {section==='installments'&&<>
          <div className="flex flex-wrap justify-between gap-4 items-center mb-7"><div><h1 className="text-3xl font-extrabold tracking-tight">Parcelamentos</h1><p className="text-sm text-slate-400 mt-1">Acompanhe compras divididas em várias parcelas.</p></div><button className="btn-primary" onClick={()=>openEntry('expense')}><Plus size={17}/> Nova compra</button></div>
          {groups.length===0?<div className="card"><Empty title="Nenhuma compra parcelada ainda" detail="Crie uma despesa e selecione 2 ou mais parcelas para acompanhar os pagamentos aqui."/></div>:<div className="grid lg:grid-cols-2 gap-5">{groups.map(group=>{
            const list=group.items;const amount=list.reduce((s,t)=>s+t.amount_cents,0);const paid=list.filter(t=>t.paid).reduce((s,t)=>s+t.amount_cents,0);const done=list.filter(t=>t.paid).length;const expected=list[0].installment_count||list.length;
            return <div className="card p-5 sm:p-6" key={group.id}><div className="flex justify-between gap-3"><div><div className="text-[11px] text-emerald-600 font-bold mb-2">COMPRA PARCELADA</div><h3 className="text-lg font-extrabold">{list[0].title}</h3><p className="text-xs text-slate-400 mt-1">{list.length} parcela(s) cadastrada(s) · {expected} originalmente</p></div><button aria-label="Excluir compra inteira" title="Excluir compra inteira" className="text-slate-400 hover:text-rose-600 h-9 p-2" onClick={()=>void deleteGroup(group.id,list[0].title)}><Trash2 size={17}/></button></div>
              <div className="grid grid-cols-2 gap-3 mt-5"><div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400">Total cadastrado</div><div className="font-extrabold mt-1">{currency(amount)}</div></div><div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400">Ainda pendente</div><div className="font-extrabold mt-1">{currency(amount-paid)}</div></div></div>
              <div className="flex justify-between text-xs mt-5 mb-2"><span className="text-slate-500">{done} de {list.length} parcelas pagas</span><b>{Math.round(done/list.length*100)}%</b></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="bg-emerald-600 h-full rounded-full" style={{width:`${done/list.length*100}%`}}/></div>
              <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">{list.map(t=><div key={t.id} className="flex justify-between gap-2 items-center text-xs py-2 border-b border-slate-50"><div><span className="font-bold">{t.installment_number}/{t.installment_count}</span> <span className="text-slate-400 ml-1">{dateLabel(t.due_date)}</span></div><div className="flex gap-3 items-center"><span className="font-bold">{currency(t.amount_cents)}</span><button title="Alternar pagamento" aria-label={`Marcar parcela ${t.installment_number} como ${t.paid?'pendente':'paga'}`} className={`pill ${t.paid?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`} onClick={()=>void togglePaid(t)}>{t.paid?'Pago':'Pendente'}</button></div></div>)}</div>
            </div>;
          })}</div>}
        </>}
        {section==='planning'&&<>
          <div className="mb-7"><h1 className="text-3xl font-extrabold tracking-tight">Planejamento financeiro</h1><p className="text-sm text-slate-500 mt-1">Cadastre seu salário uma vez e veja a previsão para os meses seguintes, sem repetir lançamentos.</p></div>
          <div className="grid lg:grid-cols-2 gap-5 items-start">
            <form onSubmit={e=>void saveSalary(e)} className="card p-6 space-y-4">
              <h2 className="font-extrabold text-lg">Minha renda mensal</h2>
              <div><label className="label">Salário líquido previsto (R$)</label><input required className="input" inputMode="decimal" value={salaryInput} onChange={e=>setSalaryInput(e.target.value)} placeholder="Ex.: 5.000,00"/></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="label">Dia do pagamento</label><select className="input" value={salaryDay} onChange={e=>setSalaryDay(Number(e.target.value))}>{Array.from({length:31},(_,i)=><option key={i} value={i+1}>Dia {i+1}</option>)}</select></div><div><label className="label">Válido a partir de</label><input type="month" required className="input" value={salaryEffective} onChange={e=>setSalaryEffective(e.target.value)}/></div></div>
              <label className="flex gap-3 items-center text-sm"><input type="checkbox" checked={salaryEnabled} onChange={e=>setSalaryEnabled(e.target.checked)} className="h-4 w-4 accent-emerald-600"/>Considerar este salário nos meses seguintes</label>
              <p className="text-xs text-slate-500 leading-relaxed">O Zentro mostra o salário como <b>previsto</b> no dia escolhido. Ele só entra como <b>recebido</b> quando você confirmar na página Movimentações. Meses com menos dias usam o último dia do mês.</p>
              <button disabled={busy||!salaryInput.trim()} className="btn-primary w-full">{busy?'Salvando...':'Salvar planejamento'}</button>
            </form>
            <div className="space-y-5">
              <div className="card p-6"><h2 className="font-extrabold mb-4">Previsão de {monthLabel(month)}</h2>
                <div className="space-y-3 text-sm"><div className="flex justify-between"><span>Receitas previstas</span><b className="text-emerald-600">{currency(income)}</b></div><div className="flex justify-between"><span>Despesas cadastradas</span><b className="text-rose-600">{currency(expenses)}</b></div><div className="flex justify-between"><span>Das quais parceladas</span><b>{currency(thisMonth.filter(t=>t.type==='expense'&&t.group_id).reduce((sum,t)=>sum+t.amount_cents,0))}</b></div><div className="border-t pt-3 flex justify-between"><b>Quanto deve sobrar no mês</b><b className={income-expenses>=0?'text-emerald-600':'text-rose-600'}>{currency(income-expenses)}</b></div></div>
                <p className="text-xs text-slate-500 mt-4">Este resultado é uma projeção mensal. Não representa saldo bancário ou dinheiro já disponível.</p>
              </div>
              <div className="card p-6"><h2 className="font-extrabold mb-3">Como usar</h2><p className="text-sm text-slate-500 leading-relaxed">Após salvar, volte à <b>Visão geral</b> ou <b>Movimentações</b>. A receita aparecerá nos meses planejados. Quando o salário cair na conta, clique em <b>Pendente</b> para confirmar. O registro real ficará salvo no Supabase, sem duplicação após atualizar a página.</p><button className="btn-outline mt-4" onClick={()=>setSection('transactions')}>Ver movimentações</button></div>
            </div>
          </div>
        </>}
        {section==='categories'&&<>
          <div className="mb-7"><h1 className="text-3xl font-extrabold tracking-tight">Categorias</h1><p className="text-sm text-slate-400 mt-1">Personalize a organização do seu dinheiro.</p></div>
          <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start"><form className="card p-6 space-y-4" onSubmit={e=>void createCategory(e)}><h2 className="font-extrabold">Nova categoria</h2><div><label className="label">Nome</label><input required maxLength={60} className="input" value={catName} onChange={e=>setCatName(e.target.value)} placeholder="Ex.: Pets, presentes..."/></div><div><label className="label">Tipo</label><select className="input" value={catType} onChange={e=>setCatType(e.target.value as Kind)}><option value="expense">Despesa</option><option value="income">Receita</option></select></div><div><label className="label">Cor de identificação</label><input aria-label="Cor da categoria" className="w-full h-11 rounded-lg cursor-pointer" type="color" value={catColor} onChange={e=>setCatColor(e.target.value)}/></div><button disabled={busy||!catName.trim()} className="btn-primary w-full"><Plus size={17}/> Adicionar categoria</button></form>
          <div className="card p-6"><h2 className="font-extrabold mb-5">Suas categorias</h2>{(['expense','income'] as Kind[]).map(type=><div key={type} className="mb-6"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">{type==='expense'?'Despesas':'Receitas'}</h3><div className="grid sm:grid-cols-2 gap-2">{categories.filter(c=>c.type===type).map(c=><div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><div className="flex items-center gap-2.5 text-sm font-bold"><span className="h-3 w-3 rounded-full" style={{background:c.color}}/>{c.name}</div><button aria-label={`Excluir ${c.name}`} title="Excluir categoria" className="p-1 text-slate-400 hover:text-rose-600" onClick={()=>void deleteCategory(c)}><Trash2 size={15}/></button></div>)}</div></div>)}</div></div>
        </>}
      </div>
    </main>
    {entryOpen&&<EntryModal key={editing?.id||defaultType+'-new'} categories={categories} initial={editing} defaultType={defaultType} busy={busy} onClose={()=>{setEntryOpen(false);setEditing(null);}} onSave={saveEntry}/>}
  </div>;
}
