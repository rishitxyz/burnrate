import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button, Typography, ElevatedCard, Tag } from '@cred/neopop-web/lib/components';
import { FontType, FontWeights } from '@cred/neopop-web/lib/components/Typography/types';
import {
  getStatements,
  deleteStatement,
  reparseStatement,
  reparseAllStatements,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategoryById,
  getTagDefinitions,
  createTagDefinition,
  deleteTagDefinition,
} from '@/lib/api';
import type { Statement } from '@/lib/types';
import type { CategoryResponse, TagDefinitionResponse } from '@/lib/api';
import { toast } from '@/components/Toast';
import { RefreshCw, Palette, X, Trash2, Tag as TagIcon } from 'lucide-react';
import { CloseButton } from '@/components/CloseButton';
import styled from 'styled-components';

const PageLayout = styled.div`
  min-height: 100vh;
  background-color: #0D0D0D;
`;

const Content = styled.main`
  padding: 32px 24px;
  max-width: 1000px;
  margin: 0 auto;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const PlaceholderCard = styled.div`
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 120px;
  grid-column: 1 / -1;

  @media (min-width: 901px) {
    grid-column: 1 / 2;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const ColorInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  input[type='color'] {
    width: 40px;
    height: 40px;
    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    background: transparent;
  }
`;

const TagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const TagWithDelete = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const CategoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  th {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #ffffff;
    font-size: 13px;
  }

  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function DefineTagsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tags, setTags] = useState<TagDefinitionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      getTagDefinitions()
        .then(setTags)
        .catch(() => {
          toast.error('Failed to load tags');
          setTags([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleAdd = async () => {
    const trimmed = newTagName.trim().slice(0, 12);
    if (!trimmed) {
      toast.error('Tag name is required');
      return;
    }
    if (tags.length >= 20) {
      toast.error('Maximum 20 tags allowed');
      return;
    }
    try {
      const tag = await createTagDefinition(trimmed);
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTagName('');
      toast.success('Tag added');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add tag';
      toast.error(msg);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await deleteTagDefinition(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      toast.success('Tag removed');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete tag';
      toast.error(msg);
    }
  };

  if (!open) return null;

  return (
    <ModalOverlay>
      <ModalBackdrop onClick={onClose} />
      <ElevatedCard
        backgroundColor="#161616"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Typography fontType={FontType.BODY} fontSize={18} fontWeight={FontWeights.BOLD} color="#ffffff">
            Define Tags
          </Typography>
          <CloseButton onClick={onClose} variant="modal" />
        </div>

        <div style={{ padding: 20 }}>
          <Typography fontType={FontType.BODY} fontSize={13} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.7)" style={{ marginBottom: 16 }}>
            Define up to 20 tags. Each tag can be at most 12 characters long. A transaction can have at most 3 tags.
          </Typography>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <StyledInput
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value.slice(0, 12))}
              placeholder="Tag name (max 12 chars)"
              style={{ flex: 1 }}
            />
            <Button
              variant="secondary"
              kind="flat"
              size="medium"
              colorMode="dark"
              onClick={handleAdd}
              disabled={tags.length >= 20 || !newTagName.trim()}
            >
              Add Tag
            </Button>
          </div>

          <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.SEMI_BOLD} color="#ffffff" style={{ marginBottom: 12 }}>
            Tags ({tags.length}/20)
          </Typography>

          {loading ? (
            <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)">
              Loading...
            </Typography>
          ) : (
            <TagsWrap>
              {tags.map((t) => (
                <TagWithDelete key={t.id}>
                  <Tag colorMode="dark" type="warning">
                    {t.name}
                  </Tag>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label={`Delete ${t.name}`}
                  >
                    <X size={14} />
                  </button>
                </TagWithDelete>
              ))}
            </TagsWrap>
          )}
        </div>
      </ElevatedCard>
    </ModalOverlay>
  );
}

function ReparseRemoveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [reparseAllRunning, setReparseAllRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getStatements()
        .then(setStatements)
        .catch(() => {
          toast.error('Failed to load statements');
          setStatements([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const fmt = (d: string) => {
    if (!d) return '—';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const extractErrorMsg = (e: unknown, fallback: string): string => {
    if (e && typeof e === 'object' && 'response' in e) {
      const resp = (e as { response?: { data?: { detail?: string } } }).response;
      if (resp?.data?.detail) return resp.data.detail;
    }
    if (e instanceof Error) return e.message;
    return fallback;
  };

  const handleReparseAll = async () => {
    setReparseAllRunning(true);
    try {
      const result = await reparseAllStatements();
      toast.success(`Reparse complete: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`);
      const list = await getStatements();
      setStatements(list);
    } catch (e) {
      toast.error(extractErrorMsg(e, 'Reparse all failed'));
    } finally {
      setReparseAllRunning(false);
    }
  };

  const handleReparse = async (id: string) => {
    setActioning(id);
    try {
      const result = await reparseStatement(id);
      if (result.status === 'success') {
        toast.success(`Reparsed ${result.count ?? 0} transactions`);
        const list = await getStatements();
        setStatements(list);
      } else {
        toast.error('Reparse failed');
      }
    } catch (e) {
      toast.error(extractErrorMsg(e, 'Reparse failed'));
    } finally {
      setActioning(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Delete this statement and all its transactions? This cannot be undone.')) {
      return;
    }
    setActioning(id);
    try {
      await deleteStatement(id);
      toast.success('Statement deleted');
      setStatements((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      toast.error(extractErrorMsg(e, 'Delete failed'));
    } finally {
      setActioning(null);
    }
  };

  if (!open) return null;

  return (
    <ModalOverlay>
      <ModalBackdrop onClick={onClose} />
      <ElevatedCard
        backgroundColor="#161616"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Typography fontType={FontType.BODY} fontSize={18} fontWeight={FontWeights.BOLD} color="#ffffff">
            Reparse / Remove Statements
          </Typography>
          <CloseButton onClick={onClose} variant="modal" />
        </div>

        <div style={{ padding: 20 }}>
          <Button
            variant="secondary"
            kind="elevated"
            size="small"
            colorMode="dark"
            onClick={handleReparseAll}
            disabled={reparseAllRunning || loading || statements.length === 0}
            style={{ marginBottom: 20 }}
          >
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            {/* todo: use typography */}
            {reparseAllRunning ? 'Reparsing...' : 'Reparse All'}
          </Button>

          {loading ? (
            <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)">
              Loading...
            </Typography>
          ) : statements.length === 0 ? (
            <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)">
              No statements imported yet.
            </Typography>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {statements.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '14px 16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.SEMI_BOLD} color="#ffffff">
                        {s.bank.toUpperCase()} ...{s.cardLast4}
                      </Typography>
                      <Typography fontType={FontType.BODY} fontSize={12} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>
                        Period: {fmt(s.periodStart)} – {fmt(s.periodEnd)}
                      </Typography>
                      <Typography fontType={FontType.BODY} fontSize={12} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>
                        {s.transactionCount} transactions
                      </Typography>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="primary"
                        kind="elevated"
                        size="small"
                        colorMode="dark"
                        onClick={() => handleReparse(s.id)}
                        disabled={!!actioning}
                        style={{ minWidth: 'auto' }}
                      >
                        <RefreshCw size={14} style={{ marginRight: 4 }} />
                        Refresh
                      </Button>
                      <Button
                        variant="secondary"
                        kind="elevated"
                        size="small"
                        colorMode="dark"
                        onClick={() => handleRemove(s.id)}
                        disabled={!!actioning}
                        style={{
                          minWidth: 'auto',
                          color: '#ee4d37',
                          borderColor: 'rgba(238,77,55,0.4)',
                        }}
                      >
                        <Trash2 size={14} style={{ marginRight: 4 }} />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ElevatedCard>
    </ModalOverlay>
  );
}

function DefineCategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, { name?: string; keywords?: string; color?: string }>>({});
  const [newRow, setNewRow] = useState({ name: '', keywords: '', color: '#FF8744' });

  useEffect(() => {
    if (open) {
      setLoading(true);
      getAllCategories()
        .then(setCategories)
        .catch(() => {
          toast.error('Failed to load categories');
          setCategories([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const customCount = categories.filter((c) => !c.is_prebuilt).length;

  const handleUpdate = async (cat: CategoryResponse) => {
    const payload = edits[cat.id] ?? {};
    if (cat.is_prebuilt) {
      if (payload.color === undefined && payload.keywords === undefined) return;
      try {
        const updated = await updateCategory(cat.id, {
          color: payload.color,
          keywords: payload.keywords,
        });
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
        setEdits((e) => {
          const next = { ...e };
          delete next[cat.id];
          return next;
        });
        toast.success('Category updated');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Update failed');
      }
      return;
    }
    try {
      const updated = await updateCategory(cat.id, {
        name: payload.name ?? cat.name,
        keywords: payload.keywords ?? cat.keywords,
        color: payload.color ?? cat.color,
      });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
      setEdits((e) => {
        const next = { ...e };
        delete next[cat.id];
        return next;
      });
      toast.success('Category updated. Recategorizing transactions...');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleAdd = async () => {
    const name = newRow.name.trim();
    if (!name) {
      toast.error('Category name is required');
      return;
    }
    if (customCount >= 20) {
      toast.error('Maximum 20 custom categories allowed');
      return;
    }
    try {
      toast.success('Category added. Recategorizing transactions...');
      const cat = await createCategory({
        name,
        keywords: newRow.keywords.trim(),
        color: newRow.color,
      });
      setCategories((prev) => [...prev, cat].sort((a, b) => (a.is_prebuilt === b.is_prebuilt ? 0 : a.is_prebuilt ? 1 : -1) || a.name.localeCompare(b.name)));
      setNewRow({ name: '', keywords: '', color: '#FF8744' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add category');
    }
  };

  const handleDelete = async (cat: CategoryResponse) => {
    if (cat.is_prebuilt) return;
    try {
      await deleteCategoryById(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success('Category removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const setEdit = (id: string, field: 'name' | 'keywords' | 'color', value: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const hasEdit = (cat: CategoryResponse) => {
    const e = edits[cat.id];
    if (!e) return false;
    if (cat.is_prebuilt) return (e.color !== undefined && e.color !== cat.color) || (e.keywords !== undefined && e.keywords !== cat.keywords);
    return (e.name !== undefined && e.name !== cat.name) || (e.keywords !== undefined && e.keywords !== cat.keywords) || (e.color !== undefined && e.color !== cat.color);
  };

  const hasAnyEdits = categories.some((cat) => hasEdit(cat));

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (newRow.name.trim()) {
        await handleAdd();
      }
      const editedCats = categories.filter((cat) => hasEdit(cat));
      for (const cat of editedCats) {
        await handleUpdate(cat);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEdits({});
    setNewRow({ name: '', keywords: '', color: '#FF8744' });
    onClose();
  };

  if (!open) return null;

  return (
    <ModalOverlay>
      <ModalBackdrop onClick={onClose} />
      <ElevatedCard
        backgroundColor="#161616"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Typography fontType={FontType.BODY} fontSize={18} fontWeight={FontWeights.BOLD} color="#ffffff">
            Customize Categories
          </Typography>
          <CloseButton onClick={onClose} variant="modal" />
        </div>

        <div style={{ padding: 20 }}>
          <Typography fontType={FontType.BODY} fontSize={13} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.7)" style={{ marginBottom: 8 }}>
            Transactions which don&apos;t belong to your custom categories would fall back to pre-built categories.
          </Typography>
          <Typography fontType={FontType.BODY} fontSize={13} fontWeight={FontWeights.REGULAR} color="#FF8744" style={{ marginBottom: 20 }}>
            Do not create custom categories for credit card bill payments.
          </Typography>

          <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.SEMI_BOLD} color="#ffffff" style={{ marginBottom: 12 }}>
            Categories ({categories.length} total, {customCount} custom / 20 max)
          </Typography>

          {loading ? (
            <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)">
              Loading...
            </Typography>
          ) : (
            <CategoryTable>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Keywords</th>
                  <th>Color</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          value={edits[cat.id]?.name ?? cat.name}
                          onChange={(e) => setEdit(cat.id, 'name', e.target.value)}
                          disabled={cat.is_prebuilt}
                          placeholder="Name"
                          style={{ flex: 1 }}
                        />
                        {!cat.is_prebuilt && (
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ee4d37',
                              cursor: 'pointer',
                              padding: 4,
                              flexShrink: 0,
                            }}
                            aria-label={`Delete ${cat.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        value={edits[cat.id]?.keywords ?? cat.keywords}
                        onChange={(e) => setEdit(cat.id, 'keywords', e.target.value)}
                        placeholder="Keywords (comma-separated)"
                      />
                    </td>
                    <td>
                      <ColorInputWrapper>
                        <input
                          type="color"
                          value={edits[cat.id]?.color ?? cat.color}
                          onChange={(e) => setEdit(cat.id, 'color', e.target.value)}
                        />
                        <input
                          type="text"
                          value={edits[cat.id]?.color ?? cat.color}
                          onChange={(e) => setEdit(cat.id, 'color', e.target.value)}
                          style={{ width: 90 }}
                        />
                      </ColorInputWrapper>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <input
                      value={newRow.name}
                      onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value.slice(0, 50) }))}
                      placeholder="New category name"
                    />
                  </td>
                  <td>
                    <input
                      value={newRow.keywords}
                      onChange={(e) => setNewRow((r) => ({ ...r, keywords: e.target.value }))}
                      placeholder="Keywords (comma-separated)"
                    />
                  </td>
                  <td>
                    <ColorInputWrapper>
                      <input type="color" value={newRow.color} onChange={(e) => setNewRow((r) => ({ ...r, color: e.target.value }))} />
                      <input
                        type="text"
                        value={newRow.color}
                        onChange={(e) => setNewRow((r) => ({ ...r, color: e.target.value }))}
                        style={{ width: 90 }}
                      />
                    </ColorInputWrapper>
                  </td>
                </tr>
              </tbody>
            </CategoryTable>
          )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                padding: '16px 20px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Button variant="primary" kind="elevated" size="small" colorMode="dark" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                kind="elevated"
                size="small"
                colorMode="dark"
                onClick={handleSaveAll}
                disabled={loading || (!hasAnyEdits && !newRow.name.trim()) || saving}
              >
                {saving ? 'Saving...' : 'Update All'}
              </Button>
            </div>
        </div>
      </ElevatedCard>
    </ModalOverlay>
  );
}

export function Customize() {
  const navigate = useNavigate();
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [reparseModalOpen, setReparseModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  return (
    <PageLayout>
      <Navbar activeTab="customize" onTabChange={(tab) => navigate(`/${tab}`)} />
      <Content>
        <CardsGrid>
          <FeatureCard onClick={() => setTagsModalOpen(true)}>
            <TagIcon size={24} color="#FF8744" />
            <Typography fontType={FontType.BODY} fontSize={16} fontWeight={FontWeights.SEMI_BOLD} color="#ffffff">
              Define Tags
            </Typography>
            <Typography fontType={FontType.BODY} fontSize={13} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)">
              Create tags to label transactions.
            </Typography>
          </FeatureCard>

          <FeatureCard onClick={() => setReparseModalOpen(true)}>
            <RefreshCw size={24} color="#FF8744" />
            <Typography fontType={FontType.BODY} fontSize={16} fontWeight={FontWeights.SEMI_BOLD} color="#ffffff">
              Reparse/Remove Statements
            </Typography>
            <Typography fontType={FontType.BODY} fontSize={13} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)">
              Re-import or delete imported statements.
            </Typography>
          </FeatureCard>

          <FeatureCard onClick={() => setCategoriesModalOpen(true)}>
            <Palette size={24} color="#FF8744" />
            <Typography fontType={FontType.BODY} fontSize={16} fontWeight={FontWeights.SEMI_BOLD} color="#ffffff">
              Customize Categories
            </Typography>
            <Typography fontType={FontType.BODY} fontSize={13} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.5)">
              Create and edit categories for transaction categorization.
            </Typography>
          </FeatureCard>

          <PlaceholderCard>
            <Typography fontType={FontType.BODY} fontSize={14} fontWeight={FontWeights.REGULAR} color="rgba(255,255,255,0.35)">
              Coming soon
            </Typography>
          </PlaceholderCard>
        </CardsGrid>

        <DefineTagsModal open={tagsModalOpen} onClose={() => setTagsModalOpen(false)} />
        <ReparseRemoveModal open={reparseModalOpen} onClose={() => setReparseModalOpen(false)} />
        <DefineCategoriesModal open={categoriesModalOpen} onClose={() => setCategoriesModalOpen(false)} />
      </Content>
    </PageLayout>
  );
}
