import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type {
  FolderDestination,
  FolderDestinationRoot,
} from '@/models/folder-destination';
import {
  FolderDestinationItemIcon,
  FolderDestinationLayout,
  FolderDestinationView,
} from '@/types/folder-destination-panel';
import { FolderDestinationPanelBody } from './FolderDestinationPanelBody';

const meta: Meta<typeof FolderDestinationPanelBody> = {
  title: 'Overlays/FolderDestinationPanelBody',
  component: FolderDestinationPanelBody,
  tags: ['folders'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The content of `FolderDestinationPanel` without its drawer: the item summary and destination, or the folder search and tree. For a host that renders the body in its own container and drives the view itself.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-[560px] w-[480px] rounded-xl border border-tertiary bg-layer-raised p-[22px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof meta>;

const roots: FolderDestinationRoot[] = [
  {
    key: 'personal',
    label: 'Personal',
    items: [
      {
        path: ['Reports'],
        name: 'Reports',
        children: [{ path: ['Reports', '2025'], name: '2025', children: [] }],
      },
      { path: ['Archive'], name: 'Archive', children: [] },
    ],
  },
  {
    key: 'organization',
    label: 'Organization',
    items: [{ path: ['Policies'], name: 'Policies', children: [] }],
  },
];

const BodyComponent = ({
  initialView,
  layout,
}: {
  initialView: FolderDestinationView;
  layout: FolderDestinationLayout;
}) => {
  const [view, setView] = useState(initialView);
  const [destination, setDestination] = useState<FolderDestination>({
    rootKey: 'personal',
    path: ['Reports'],
  });
  const [pending, setPending] = useState<FolderDestination | undefined>(
    destination,
  );

  return (
    <FolderDestinationPanelBody
      view={view}
      layout={layout}
      item={{
        title: 'quarterly-report.pdf',
        iconKind: FolderDestinationItemIcon.File,
      }}
      roots={roots}
      destination={destination}
      onDestinationChange={(next) => {
        setDestination(next);
        setView(FolderDestinationView.Main);
      }}
      onCreateFolder={async () => undefined}
      onChangeFolderClick={() => {
        setPending(destination);
        setView(FolderDestinationView.ChangeFolder);
      }}
      pendingDestination={pending}
      onPendingDestinationChange={(next) => {
        setPending(next);
        if (next) setDestination(next);
      }}
    />
  );
};

/** The main view: the item, the committed destination and a Change action. */
export const Main: Story = {
  render: () => (
    <BodyComponent
      initialView={FolderDestinationView.Main}
      layout={FolderDestinationLayout.Steps}
    />
  ),
};

/** The folder view: the search and the destination tree, with the pending pick highlighted. */
export const ChangeFolder: Story = {
  render: () => (
    <BodyComponent
      initialView={FolderDestinationView.ChangeFolder}
      layout={FolderDestinationLayout.Steps}
    />
  ),
};

/** Inline layout: the search and tree live in the main view, so a pick is the destination at once. */
export const Inline: Story = {
  render: () => (
    <BodyComponent
      initialView={FolderDestinationView.Main}
      layout={FolderDestinationLayout.Inline}
    />
  ),
};
