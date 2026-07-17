import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DndContext, PointerSensor, useSensor, useSensors, pointerWithin, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast, Toaster } from 'sonner';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropsPanel from './components/PropsPanel';
import GenerateModal from './components/GenerateModal';
import PageSettingsModal from './components/PageSettingsModal';
import Loading from '../../components/Loading';
import usePageBuilder from './hooks/usePageBuilder';
import { componentsMap } from './blocks/componentsMap';

export default function PageEditor() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [selectedId, setSelectedId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Selecting a different block always drops any element selected inside the
  // previous one — the element fields shown at the top of PropsPanel only
  // make sense while their parent block is the active selection.
  const handleSelectBlock = (blockId) => {
    setSelectedId(blockId);
    setSelectedElementId(null);
  };

  const handleSelectElement = (blockId, elementId) => {
    setSelectedId(blockId);
    setSelectedElementId(elementId);
  };

  const {
    name,
    productId,
    settings,
    setSettings,
    blocks,
    setBlocks,
    publishedUrl,
    loading,
    error,
    saving,
    publishing,
    generating,
    dirty,
    save,
    publish,
    generate,
    isDemo,
  } = usePageBuilder(id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // closestCenter alone picks the wrong target here: it compares the dragged
  // item's center to each droppable's center, and the large canvas-dropzone
  // wrapper (which spans the whole scroll pane) often has a closer center
  // than the small block actually under the cursor, so `over` resolves to
  // the dropzone instead of the block. pointerWithin checks whether the
  // pointer itself is inside a droppable's rect, which usually favors the
  // smaller, nested block over the container it sits in — but canvas-dropzone
  // is height-capped to the viewport (it scrolls internally), so a tall
  // block's own rect (e.g. an image block holding a full-aspect-ratio photo
  // taller than the visible canvas) can end up with a *larger* raw area than
  // the dropzone's, which flips a plain size comparison the wrong way. A
  // block under the pointer is always the right target over the container it
  // sits inside, so the dropzone is dropped from the candidates whenever a
  // real block also matches — it only wins when it's the sole match (pointer
  // over empty canvas space, not any block). Remaining ties fall back to
  // smallest-area. closestCenter is only used when there's no pointer at all
  // (keyboard dragging).
  const collisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length === 0) return closestCenter(args);

    const blockCollisions = pointerCollisions.filter((c) => c.id !== 'canvas-dropzone');
    const candidates = blockCollisions.length > 0 ? blockCollisions : pointerCollisions;

    return [...candidates].sort((a, b) => {
      const rectA = args.droppableRects.get(a.id);
      const rectB = args.droppableRects.get(b.id);
      const areaA = rectA ? rectA.width * rectA.height : Infinity;
      const areaB = rectB ? rectB.width * rectB.height : Infinity;
      return areaA - areaB;
    });
  };

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.source === 'palette') {
      const def = componentsMap[activeData.blockType];
      if (def.singleton && blocks.some((b) => b.type === activeData.blockType)) {
        toast.error(t('editor.sidebar.singletonBlocked', { block: t(def.labelKey) }));
        return;
      }
      const newBlock = { id: crypto.randomUUID(), type: activeData.blockType, props: {} };
      setBlocks((prev) => {
        if (over.id === 'canvas-dropzone') return [...prev, newBlock];
        const overIndex = prev.findIndex((b) => b.id === over.id);
        if (overIndex === -1) return [...prev, newBlock];
        const next = [...prev];
        next.splice(overIndex, 0, newBlock);
        return next;
      });
      handleSelectBlock(newBlock.id);
      return;
    }

    if (activeData?.source === 'element-palette') {
      const targetBlock = blocks.find((b) => b.id === over.id);
      if (!targetBlock) {
        toast.error(t('editor.sidebar.elementsNeedBlock'));
        return;
      }

      const activeRect = active.rect.current?.translated;
      let x = 50;
      let y = 50;
      if (activeRect && over.rect) {
        const centerX = activeRect.left + activeRect.width / 2;
        const centerY = activeRect.top + activeRect.height / 2;
        x = Math.min(100, Math.max(0, ((centerX - over.rect.left) / over.rect.width) * 100));
        y = Math.min(100, Math.max(0, ((centerY - over.rect.top) / over.rect.height) * 100));
      }

      let newElement;
      if (activeData.elementType === 'button') {
        newElement = { id: crypto.randomUUID(), type: 'button', text: t('editor.canvasSection.newButton'), linkType: 'external', link: '#', x, y, backgroundColor: '#10b981', textColor: '#ffffff' };
      } else if (activeData.elementType === 'image') {
        newElement = { id: crypto.randomUUID(), type: 'image', src: '', alt: '', x, y, width: 40, height: 160 };
      } else {
        newElement = { id: crypto.randomUUID(), type: 'text', content: t('editor.canvasSection.newText'), x, y, fontSize: 20, fontWeight: 600, color: '#27272a' };
      }

      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== targetBlock.id) return b;
          const existing = b.props.elements ?? componentsMap[b.type].defaultProps.elements ?? [];
          return { ...b, props: { ...b.props, elements: [...existing, newElement] } };
        })
      );
      handleSelectElement(targetBlock.id, newElement.id);
      return;
    }

    if (active.id !== over.id && over.id !== 'canvas-dropzone') {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleUpdateProps = (blockId, partialProps) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const nextProps = { ...b.props, ...partialProps };

        // Floating elements position by y%, relative to the block's own
        // height — so whenever that height changes, for any reason (typed
        // into the props panel, dragged via the block's own resize handle,
        // or grown automatically to fit a tall element), every element's y
        // must be rescaled too, or it silently ends up somewhere else the
        // instant the height it's a percentage of changes underneath it.
        // This is the one place all of those paths funnel through.
        const def = componentsMap[b.type];
        if (def && partialProps.height != null) {
          const oldHeight = b.props.height ?? def.defaultProps.height;
          const newHeight = partialProps.height;
          const elements = nextProps.elements ?? def.defaultProps.elements;
          if (oldHeight && newHeight && Array.isArray(elements)) {
            const scale = oldHeight / newHeight;
            nextProps.elements = elements.map((el) => ({ ...el, y: (el.y ?? 50) * scale }));
          }
        }

        return { ...b, props: nextProps };
      })
    );
  };

  const handleDelete = (blockId) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedId === blockId) {
      setSelectedId(null);
      setSelectedElementId(null);
    }
  };

  // For corrupted tree entries with no `id` (or several sharing the same
  // missing id) — deletes by array position instead, since `id`-based
  // lookup can't tell them apart.
  const handleDeleteAt = (index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setSelectedId(null);
    setSelectedElementId(null);
  };

  const handleDuplicate = (blockId) => {
    const target = blocks.find((b) => b.id === blockId);
    const targetDef = target && componentsMap[target.type];
    if (targetDef?.singleton) {
      toast.error(t('editor.sidebar.singletonBlocked', { block: t(targetDef.labelKey) }));
      return;
    }
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;
      const copy = { ...prev[index], id: crypto.randomUUID() };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  // Reorders by page position (up = earlier on the page), not the
  // z-stacking "forward/backward" language used for a block's own floating
  // elements — blocks are sequential in the page flow, not overlapping.
  const handleReorderBlock = (blockId, direction) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === blockId);
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || newIndex < 0 || newIndex >= prev.length) return prev;
      return arrayMove(prev, index, newIndex);
    });
  };

  const handleSave = async () => {
    try {
      await save();
      toast.success(t('editor.topbar.saveSuccess'));
    } catch {
      toast.error(t('editor.topbar.saveError'));
    }
  };

  const handlePublish = async () => {
    try {
      const url = await publish();
      toast.success(t('editor.topbar.publishSuccess'));
      if (url && !isDemo) window.open(url, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || t('editor.topbar.publishError'));
    }
  };

  const handleGenerate = async ({ productId, description, language }) => {
    try {
      const { imageFailed } = await generate({ productId, description, language });
      setSelectedId(null);
      setSelectedElementId(null);
      if (imageFailed) {
        toast.warning(t('editor.generate.imageFailed'));
      } else {
        toast.success(t('editor.generate.success'));
      }
      return true;
    } catch {
      toast.error(t('editor.generate.error'));
      return false;
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <p className="text-sm text-rose-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950" dir={isRtl ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" richColors />
      <Topbar
        name={name}
        dirty={dirty}
        saving={saving}
        publishing={publishing}
        publishedUrl={publishedUrl}
        onSave={handleSave}
        onPublish={handlePublish}
        onOpenSettings={() => setShowSettingsModal(true)}
        isRtl={isRtl}
        isDemo={isDemo}
      />
      <GenerateModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSubmit={handleGenerate}
        generating={generating}
        isDemo={isDemo}
      />
      <PageSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onChange={setSettings}
      />
      <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          <Sidebar onOpenGenerate={() => setShowGenerateModal(true)} blocks={blocks} />
          <Canvas
            blocks={blocks}
            pageProductId={productId}
            settings={settings}
            selectedId={selectedId}
            onSelect={handleSelectBlock}
            onDelete={handleDelete}
            onDeleteAt={handleDeleteAt}
            onDuplicate={handleDuplicate}
            onUpdateProps={handleUpdateProps}
            selectedElementId={selectedElementId}
            onSelectElement={handleSelectElement}
          />
          <PropsPanel
            block={selectedBlock}
            blocks={blocks}
            onUpdateProps={handleUpdateProps}
            onDelete={handleDelete}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onSelectBlock={handleSelectBlock}
            onReorderBlock={handleReorderBlock}
          />
        </div>
      </DndContext>
    </div>
  );
}
