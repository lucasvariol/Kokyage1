"use client";
import dayjs from 'dayjs';
import { useState, useEffect, Suspense } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { supabase } from '@/lib/supabaseClient';
import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';


function CalendrierContent({ listingId: initialListingId }) {
  const searchParams = useSearchParams();
  const [selectedDates, setSelectedDates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [listings, setListings] = useState([]);
  const [listingId, setListingId] = useState(initialListingId || null);
  const [user, setUser] = useState(null);
  const [existingDates, setExistingDates] = useState([]);
  const [bookedDates, setBookedDates] = useState([]); // Dates déjà réservées
  const [error, setError] = useState("");
  const [loadingDates, setLoadingDates] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [listingMeta, setListingMeta] = useState(null); // {id, title, owner_id, id_proprietaire}

  useEffect(() => {
    async function fetchUserAndListings() {
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setListings([]);
        return;
      }
      setUser(session.user);
      const { data, error } = await supabase
        .from('listings')
        .select('id, title')
        .eq('owner_id', session.user.id);
      if (error) {
        console.error(error);
        setError("Impossible de récupérer vos logements. Réessayez plus tard.");
        return;
      }
      if (data) {
        setListings(data);
        // Pré-sélection via query param si disponible
        const fromQuery = searchParams?.get('listingId');
        if (fromQuery && data.some(d => String(d.id) === String(fromQuery))) {
          setListingId(fromQuery);
        } else if (!listingId && data.length > 0) {
          setListingId(data[0].id);
        }
      }
    }
    fetchUserAndListings();
  }, []);

  async function fetchDisponibilites(id) {
    setError("");
    setLoadingDates(true);
    const { data, error } = await supabase
      .from('disponibilities')
      .select('date, booked')
      .eq('listing_id', id);
    if (error) {
      console.error(error);
      setError("Erreur lors du chargement des disponibilités.");
      setLoadingDates(false);
      return;
    }
    
    // Séparer les dates disponibles des dates réservées
    const availableDates = data ? data.filter(d => d.booked !== 'Yes').map(d => dayjs(d.date).toDate()) : [];
    const reservedDates = data ? data.filter(d => d.booked === 'Yes').map(d => dayjs(d.date).toDate()) : [];
    
    // Ne met à jour l'état que si l'id est toujours celui du logement affiché
    if (id === listingId) {
      // Normalise pour éviter les problèmes de fuseau sur l'affichage/sauvegarde
      const normalizedAvailable = availableDates.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      const normalizedBooked = reservedDates.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      
      setExistingDates(normalizedAvailable);
      setSelectedDates(normalizedAvailable);
      setBookedDates(normalizedBooked);
    }
    setLoadingDates(false);
  }

  useEffect(() => {
    if (!listingId) return;
    setSelectedDates([]);
    setExistingDates([]);
    setBookedDates([]);
    fetchDisponibilites(listingId);
    // Récupère les métadonnées du logement pour déterminer si l'utilisateur peut éditer
    (async () => {
      const { data: listing, error: mErr } = await supabase
        .from('listings')
        .select('id, title, owner_id, id_proprietaire')
        .eq('id', listingId)
        .maybeSingle();
      if (mErr) {
        console.warn('Meta listing error', mErr);
        setListingMeta(null);
        setCanEdit(false);
        return;
      }
      setListingMeta(listing);
      // Seul le locataire principal (owner_id) peut éditer
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const editable = !!(uid && listing && String(listing.owner_id) === String(uid));
      setCanEdit(editable);
    })();
  }, [listingId]);

  // Utilise onSelect de DayPicker (mode="multiple") pour gérer la sélection
  const handleSelect = (dates) => {
    if (!canEdit) return;
    
    // dates peut être null si tout est désélectionné
    const normalized = (dates || []).map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    
    // Filtrer pour empêcher la sélection/désélection des dates réservées
    const bookedDatesSet = new Set(bookedDates.map(d => dayjs(d).format('YYYY-MM-DD')));
    const filteredDates = normalized.filter(d => {
      const dateStr = dayjs(d).format('YYYY-MM-DD');
      return !bookedDatesSet.has(dateStr);
    });
    
    // Réajouter les dates réservées qui étaient déjà dans la sélection
    // (pour éviter qu'elles disparaissent visuellement)
    const allDates = [...filteredDates, ...bookedDates];
    setSelectedDates(allDates);
  };

  async function handleSave(currentListingId) {
    setError("");
    if (!currentListingId) {
      setError("Aucun logement sélectionné.");
      return;
    }
    setSaving(true);
    try {
      const selectedIso = selectedDates.map(d => dayjs(d).format('YYYY-MM-DD'));
      const existingIso = existingDates.map(d => dayjs(d).format('YYYY-MM-DD'));
      const toAdd = selectedIso.filter(date => !existingIso.includes(date));
      const toRemove = existingIso.filter(date => !selectedIso.includes(date));

      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('disponibilities')
          .insert(toAdd.map(date => ({ listing_id: currentListingId, date })));
        if (insertError) throw insertError;
      }

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('disponibilities')
          .delete()
          .eq('listing_id', currentListingId)
          .in('date', toRemove);
        if (deleteError) throw deleteError;
      }

      await fetchDisponibilites(currentListingId); // Synchronisation explicite
      setSaveMessage("Modifications sauvegardées !");
      setTimeout(() => setSaveMessage("") , 2500);
    } catch (e) {
      console.error(e);
      setError("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  }

  // Détection de modifications
  const isDirty = (() => {
    const a = new Set(selectedDates.map(d => dayjs(d).format('YYYY-MM-DD')));
    const b = new Set(existingDates.map(d => dayjs(d).format('YYYY-MM-DD')));
    if (a.size !== b.size) return true;
    for (const v of a) if (!b.has(v)) return true;
    return false;
  })();

  return (
    <>
      <Header />
      <main style={{ fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f7f8fa', minHeight: '100vh', paddingBottom: 32 }}>
        <section className="cal-wrapper" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 6px 30px rgba(0,0,0,0.07)', padding: '24px', margin: '32px auto', maxWidth: 1100, border: '1px solid #e9edf3' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', margin: 0 }}>🗓️ Calendrier des nuits disponibles</h1>
              <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>Sélectionnez les nuits où votre logement est disponible. Enregistrez quand vous avez terminé.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', maxWidth: 460 }}>
              <label htmlFor="listingSelect" style={{ fontSize: 14, color: '#555', minWidth: 120 }}>Votre logement</label>
              <select
                id="listingSelect"
                value={listingId || ''}
                onChange={(e) => setListingId(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #e0e3e7', background: '#fafbfc', transition: 'box-shadow .2s, border-color .2s' }}
              >
                <option value="" disabled>Choisir un logement…</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 12px', background: '#fff1f1', color: '#b40000', border: '1px solid #ffd1d1', borderRadius: 10 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginTop: 24 }}>
            <div style={{ width: '100%', overflow: 'hidden' }}>
              {loadingDates && (
                <div style={{ marginBottom: 10, fontSize: 14, color: '#6b7280' }}>Chargement des disponibilités…</div>
              )}
              <DayPicker
                key={listingId}
                mode="multiple"
                selected={selectedDates}
                onSelect={canEdit ? handleSelect : undefined}
                numberOfMonths={2}
                showOutsideDays
                fromMonth={new Date()}
                locale={fr}
                modifiers={{
                  booked: bookedDates
                }}
                modifiersClassNames={{ 
                  selected: 'selected-night',
                  booked: 'booked-night'
                }}
                disabled={canEdit ? [
                  { before: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) },
                  ...bookedDates // Empêcher la sélection des dates réservées
                ] : [{ from: new Date(1900,0,1), to: new Date(3000,0,1) }]}
                styles={{
                  caption: { textTransform: 'capitalize' },
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ padding: '6px 10px', background: '#eef5ff', color: '#1d4ed8', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    {selectedDates.length - bookedDates.length} nuit{(selectedDates.length - bookedDates.length) > 1 ? 's' : ''} disponible{(selectedDates.length - bookedDates.length) > 1 ? 's' : ''}
                  </span>
                  {bookedDates.length > 0 && (
                    <span style={{ padding: '6px 10px', background: '#f3e8ff', color: '#7c3aed', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      {bookedDates.length} nuit{bookedDates.length > 1 ? 's' : ''} réservée{bookedDates.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#6b7280', fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, background: '#222', borderRadius: 4, display: 'inline-block' }} /> Disponible
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, background: '#7c3aed', borderRadius: 4, display: 'inline-block' }} /> Réservée
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, border: '1px dashed #9ca3af', borderRadius: 4, display: 'inline-block' }} /> Aujourd'hui
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, background: '#f3f4f6', borderRadius: 4, display: 'inline-block' }} /> Passé
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <button
                onClick={() => handleSave(listingId)}
                style={{
                  padding: '12px 18px',
                  background: (isDirty && canEdit) ? 'linear-gradient(180deg, #2980ff 0%, #0066ff 100%)' : '#9abcf7',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: (saving || !isDirty || !canEdit) ? 'not-allowed' : 'pointer',
                  boxShadow: (isDirty && canEdit) ? '0 6px 20px rgba(0,102,255,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'transform .1s ease, box-shadow .2s ease, opacity .2s ease',
                  opacity: saving ? 0.8 : 1
                }}
                disabled={saving || !isDirty || !canEdit}
              >
                {saving ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
              </button>
              {saveMessage && (
                <span style={{ color: '#0ea5e9', fontWeight: 700, background: '#ecfeff', border: '1px solid #a5f3fc', padding: '8px 10px', borderRadius: 8 }}>{saveMessage}</span>
              )}
            </div>

            {!canEdit && listingMeta && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff9e6', color: '#92400e', border: '1px solid #fde68a', borderRadius: 10 }}>
                Calendrier en lecture seule. Seul le locataire principal peut modifier les disponibilités.
              </div>
            )}
          </div>

          <style jsx>{`
            :global(.selected-night) {
              background: #222 !important;
              color: #fff !important;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            }
            :global(.booked-night) {
              background: #7c3aed !important;
              color: #fff !important;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(124,58,237,0.25);
              cursor: not-allowed !important;
              position: relative;
            }
            :global(.booked-night:hover) {
              background: #7c3aed !important;
              opacity: 0.9;
            }
            :global(.rdp) {
              --rdp-accent-color: #0066ff;
              --rdp-background-color: #eef5ff;
              --rdp-outline: 2px solid #bfdbfe;
            }
            :global(.rdp .rdp-day) {
              transition: transform .05s ease, background-color .2s ease, color .2s ease;
              border-radius: 8px;
            }
            :global(.rdp .rdp-day:hover) {
              background: #f1f5ff;
            }
            :global(.rdp .rdp-day_today) {
              outline: 1px dashed #9ca3af;
              outline-offset: -2px;
            }
            :global(.rdp .rdp-day_disabled) {
              color: #c0c6cf !important;
            }
            :global(.rdp .rdp-nav button) {
              border-radius: 8px;
            }
            @media (min-width: 980px) {
              .cal-wrapper { padding: 32px; }
            }
          `}</style>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function Calendrier({ listingId: initialListingId }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CalendrierContent listingId={initialListingId} />
    </Suspense>
  );
}
