
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useDemands } from '../context/DemandsContext';
import { DemandStatus } from '../types';

const ProfilePage: React.FC = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { demands, offers } = useDemands();
  const navigate = useNavigate();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form
  useEffect(() => {
    if (profile) {
      setFullName(profile.name || '');
      setCompanyName(profile.company_name || '');
      setCnpj(profile.cnpj || '');
      setWebsite(profile.website || '');
      setPhone(profile.phone || '');
      setRole(profile.bio || ''); // Using bio as role/function
    }
  }, [profile]);

  // Real stats calculation
  const stats = useMemo(() => {
    if (!user) return { demandsCreated: 0, acceptedOffers: 0 };

    const demandsCreated = demands.filter(d => d.ownerId === user.id).length;
    const acceptedOffers = offers.filter(o => o.sellerId === user.id && o.status === 'accepted').length;

    return { demandsCreated, acceptedOffers };
  }, [demands, offers, user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: fullName,
        company_name: companyName,
        cnpj: cnpj,
        website: website,
        phone: phone,
        bio: role
      });
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const openPhotoModal = () => {
    setIsPhotoModalOpen(true);
    setTempPhotoUrl(profile?.avatar_url || '');
    setUrlInput('');
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setTempPhotoUrl('');
    setUrlInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    if (url.startsWith('http')) {
      setTempPhotoUrl(url);
    }
  };

  const savePhoto = async () => {
    if (tempPhotoUrl) {
      try {
        await updateProfile({ avatar_url: tempPhotoUrl });
        closePhotoModal();
      } catch (error) {
        console.error('Error saving photo:', error);
        alert('Erro ao salvar foto.');
      }
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1080px] mx-auto flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex flex-wrap justify-between items-end gap-4 border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">Dados do Usuário</h1>
            <p className="text-slate-500">Gerencie suas informações pessoais, de segurança e privacidade.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="h-11 px-6 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 px-8 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </header>

        {/* Profile Info Card */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0 opacity-50"></div>

          <div className="relative group z-10">
            <div className="size-36 rounded-full border-4 border-white ring-1 ring-slate-100 transition-transform group-hover:scale-[1.02] duration-300 flex items-center justify-center bg-slate-100 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
              )}
            </div>
            <button
              onClick={openPhotoModal}
              className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent text-white"
            >
              <span className="material-symbols-outlined text-3xl mb-1">photo_camera</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Alterar</span>
            </button>
          </div>

          <div className="flex flex-col gap-5 text-center md:text-left flex-1 z-10">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile?.name || user?.user_metadata?.full_name || 'Usuário'}</h2>
              <p className="text-slate-500 font-medium">Membro desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '---'}</p>
              <div className="flex justify-center md:justify-start mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${profile?.is_premium ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-primary border-blue-100'} text-[10px] font-black rounded-lg uppercase tracking-widest border shadow-sm`}>
                  <span className="material-symbols-outlined text-[16px] fill-1">{profile?.is_premium ? 'workspace_premium' : 'verified_user'}</span>
                  {profile?.is_premium ? 'CONTA PREMIUM' : 'CONTA EM VERIFICAÇÃO'}
                </span>
              </div>
            </div>
            <button
              onClick={openPhotoModal}
              className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all w-fit mx-auto md:mx-0 shadow-md transform active:scale-95"
            >
              Alterar Foto de Perfil
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulários */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span> Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-900 px-1">Nome Completo</span>
                  <input
                    className="form-input rounded-xl border-slate-200 h-12 bg-slate-50 focus:ring-primary focus:bg-white transition-all px-4"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-900 px-1">Email Principal</span>
                  <input className="form-input rounded-xl border-slate-200 h-12 bg-slate-50 px-4 opacity-70 cursor-not-allowed" defaultValue={user?.email || ''} readOnly />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-900 px-1">Telefone / WhatsApp</span>
                  <input
                    className="form-input rounded-xl border-slate-200 h-12 bg-slate-50 focus:ring-primary px-4"
                    placeholder="+55 (11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-900 px-1">Cargo / Função</span>
                  <input
                    className="form-input rounded-xl border-slate-200 h-12 bg-slate-50 focus:ring-primary px-4"
                    placeholder="Gerente de Compras"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">domain</span> Dados da Empresa
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-900 px-1">Nome da Empresa (Razão Social)</span>
                  <input
                    className="form-input rounded-xl border-slate-200 h-12 bg-slate-50 focus:ring-primary px-4"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-slate-900 px-1">CNPJ</span>
                    <input
                      className="form-input rounded-xl border-slate-200 bg-slate-50 h-12 px-4 focus:ring-primary"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-slate-900 px-1">Website Oficial</span>
                    <input
                      className="form-input rounded-xl border-slate-200 h-12 bg-slate-50 focus:ring-primary px-4"
                      placeholder="https://suaempresa.com.br"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-5">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Plano Atual</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{profile?.is_premium ? 'Premium Pro' : 'Plano Gratuito'}</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded">Ativo</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${profile?.is_premium ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: profile?.is_premium ? '100%' : '60%' }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                {profile?.is_premium ? (
                  <span>Negociações Ilimitadas</span>
                ) : (
                  <>
                    <span>{stats.demandsCreated} de 5 Negociações</span>
                    <span className="font-bold">{Math.min(100, (stats.demandsCreated / 5) * 100)}% usado</span>
                  </>
                )}
              </div>
              {!profile?.is_premium && (
                <Link
                  to="/premium"
                  className="w-full h-12 bg-primary-green text-slate-900 font-black rounded-xl hover:bg-green-500 transition-all flex items-center justify-center shadow-lg shadow-green-100"
                >
                  Fazer Upgrade para Pro
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
                <span className="material-symbols-outlined text-slate-300 mb-2 text-3xl">description</span>
                <p className="text-3xl font-black text-slate-900">{stats.demandsCreated}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Demandas</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
                <span className="material-symbols-outlined text-primary-green mb-2 text-3xl fill-1">check_circle</span>
                <p className="text-3xl font-black text-slate-900">{stats.acceptedOffers}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Aceitas</p>
              </div>
            </div>

            <div className="p-6 bg-blue-900 rounded-2xl text-white space-y-4 shadow-xl shadow-blue-100">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-green">security</span>
                <p className="text-sm font-black uppercase tracking-widest">Segurança</p>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Sua conta está protegida com criptografia de ponta a ponta.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full h-14 flex items-center justify-center gap-2 bg-red-50 text-red-600 font-black rounded-xl border border-red-100 hover:bg-red-100 transition-all transform active:scale-95"
            >
              <span className="material-symbols-outlined">logout</span>
              Sair da Conta
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Alterar Foto */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closePhotoModal}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Alterar Foto de Perfil</h3>
              <button onClick={closePhotoModal} className="size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-8">
              {/* Preview */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pré-visualização</p>
                <div
                  className="size-40 rounded-full bg-cover bg-center border-4 border-slate-100 shadow-inner"
                  style={{ backgroundImage: `url(${tempPhotoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'})` }}
                ></div>
              </div>

              <div className="w-full space-y-6">
                {/* Opção 1: Upload */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">Opção 1: Carregar Arquivo</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:border-primary hover:text-primary transition-all bg-slate-50"
                  >
                    <span className="material-symbols-outlined">cloud_upload</span>
                    <span className="font-bold">Escolher Foto do Computador</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <span className="relative bg-white px-4 text-[10px] font-black text-slate-300 uppercase">Ou</span>
                </div>

                {/* Opção 2: URL */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">Opção 2: Link de Imagem Externa</p>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={handleUrlChange}
                      placeholder="Cole a URL da imagem aqui..."
                      className="w-full h-12 pl-11 pr-4 rounded-xl border-slate-200 bg-slate-50 focus:ring-primary focus:bg-white text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic px-1">Suporta links do LinkedIn, Google Fotos, Gravatar, etc.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={closePhotoModal}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={savePhoto}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
              >
                Confirmar Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;
