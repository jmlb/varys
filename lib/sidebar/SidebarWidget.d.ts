/**
 * SidebarWidget - Main chat interface for Varys.
 * Renders as a ReactWidget in the JupyterLab right sidebar.
 */
/// <reference types="react" />
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { APIClient } from '../api/client';
import { NotebookReader } from '../context/NotebookReader';
import { CellEditor } from '../editor/CellEditor';
export interface SidebarProps {
    apiClient: APIClient;
    notebookReader: NotebookReader;
    cellEditor: CellEditor;
    notebookTracker: INotebookTracker;
}
export interface ExternalMessage {
    /** Text to inject into the chat input (or auto-send). */
    text: string;
    /** When true the message is sent immediately; when false it pre-fills the input. */
    autoSend: boolean;
    /** When true the Tags panel is opened instead of sending a message. */
    openTags?: boolean;
    /**
     * Short human-readable label to show in the chat bubble in place of the full
     * prompt text (which may contain large code blocks). The full text is still
     * sent to the LLM.
     */
    displayText?: string;
    /**
     * Hidden context that is prepended to the user's typed input just before
     * sending to the backend. It is NEVER shown in the textarea or chat bubble.
     * Used by "Edit with AI" to pass the selected snippet + full cell context
     * without cluttering the input box.
     */
    contextPrefix?: string;
    /**
     * Visible chip shown in the input area (and in the sent bubble) so the user
     * knows what code context is attached without seeing the full text.
     */
    contextChip?: {
        label: string;
        preview: string;
    };
    /**
     * A specific notebook output selected by the user (right-click → Ask DS
     * Assistant). When present the task request includes this output so the LLM
     * can focus its answer on it.
     */
    selectedOutput?: {
        label: string;
        mimeType: string;
        imageData?: string;
        textData?: string;
        cellIndex: number;
        outputIndex: number;
    };
}
type ExternalMsgListener = (msg: ExternalMessage) => void;
/** Called by the React component on mount to subscribe. */
export declare function setExternalMessageListener(fn: ExternalMsgListener | null): void;
export declare class DSAssistantSidebar extends ReactWidget {
    private _props;
    constructor(props: SidebarProps);
    /**
     * Send a message into the chat panel.
     * If autoSend is true the message is submitted immediately (e.g. context-menu
     * actions); if false the text is pre-filled so the user can review/edit it.
     */
    sendMessage(text: string, autoSend?: boolean, displayText?: string, contextPrefix?: string, contextChip?: {
        label: string;
        preview: string;
    }, selectedOutput?: ExternalMessage['selectedOutput']): void;
    /** Convenience: send a specific notebook output to the chat input. */
    sendOutputToChat(output: import('../outputs/outputOverlay').SelectedOutput): void;
    /** Open the Tags & Metadata panel inside the sidebar. */
    openTagsPanel(): void;
    render(): JSX.Element;
}
export {};
