import * as React from "react";
import "azure-devops-ui/Core/override.css";
import "azure-devops-ui/Components/Icon/FluentIcons.css";
import { Card } from "azure-devops-ui/Card";
import { Icon } from "azure-devops-ui/Icon";
import { Observer } from "azure-devops-ui/Observer";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IProjectPageService, IHostNavigationService } from "azure-devops-extension-api";
import { getClient } from "azure-devops-extension-api";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { VariableGroupService } from "../services/VariableGroupService";
import { VariableGroup, TreeNode } from "../types/types";
import { HierarchicalTree } from "./HierarchicalTree";
import "../styles/library-hub.css";

interface LibraryHubState {
    loading: boolean;
    error: string | null;
    variableGroups: VariableGroup[];
    treeRoot: TreeNode | null;
    viewMode: 'hierarchy' | 'list';
    searchQuery: string;
}

export class LibraryHub extends React.Component<{}, LibraryHubState> {
    private projectName: string = "";
    private organizationUrl: string = "";

    constructor(props: {}) {
        super(props);
        this.state = {
            loading: true,
            error: null,
            variableGroups: [],
            treeRoot: null,
            viewMode: 'hierarchy',
            searchQuery: ''
        };
    }

    async componentDidMount() {
        try {
            await SDK.ready();

            // Get project information
            const projectService = await SDK.getService<IProjectPageService>(
                CommonServiceIds.ProjectPageService
            );
            const project = await projectService.getProject();
            
            if (!project) {
                throw new Error("Project information not available");
            }

            this.projectName = project.name;
            
            // Get organization URL
            const hostContext = SDK.getHost();
            this.organizationUrl = `https://${hostContext.name}.visualstudio.com`;

            // Fetch Variable Groups
            await this.loadVariableGroups();

        } catch (error) {
            console.error('Component mount error:', error);
            this.setState({
                loading: false,
                error: error instanceof Error ? error.message : "An unknown error occurred"
            });
        }
    }

    private async loadVariableGroups() {
        try {
            // Create RestClient with project context
            const client = getClient(TaskAgentRestClient);
            
            // Use project ID instead of project name
            const projectService = await SDK.getService<IProjectPageService>(
                CommonServiceIds.ProjectPageService
            );
            const project = await projectService.getProject();
            
            if (!project || !project.id) {
                throw new Error("Project information not available");
            }
            
            const vgs = await client.getVariableGroups(project.id);

            const variableGroups: VariableGroup[] = vgs.map(vg => ({
                id: vg.id!,
                name: vg.name!,
                description: vg.description || "",
                type: vg.type || "",
                variables: vg.variables,
                modifiedOn: vg.modifiedOn?.toISOString(),
                modifiedBy: vg.modifiedBy ? {
                    displayName: vg.modifiedBy.displayName || '',
                    id: vg.modifiedBy.id || ''
                } : undefined
            }));

            // Build hierarchical structure
            const treeRoot = VariableGroupService.buildHierarchy(variableGroups);

            this.setState({
                loading: false,
                variableGroups,
                treeRoot
            });

        } catch (error) {
            this.setState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to load variable groups"
            });
        }
    }

    private handleVariableGroupClick = async (vg: VariableGroup, openInNewTab: boolean) => {
        const url = VariableGroupService.getVariableGroupUrl(
            this.organizationUrl,
            this.projectName,
            vg.id
        );

        if (openInNewTab) {
            // Best-effort: open new tab without stealing focus. Browsers control focus behavior,
            // but we try to blur the new window and return focus to the current window.
            const newWin = window.open(url, '_blank');
            if (newWin) {
                try {
                    newWin.blur();
                    window.focus();
                } catch (err) {
                    // ignore - some browsers disallow programmatic focus/blur
                }
            }
        } else {
            const navService = await SDK.getService<IHostNavigationService>(
                CommonServiceIds.HostNavigationService
            );
            navService.navigate(url);
        }
    };

    private toggleViewMode = () => {
        this.setState(prevState => ({
            viewMode: prevState.viewMode === 'hierarchy' ? 'list' : 'hierarchy'
        }));
    };

    private handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ searchQuery: event.target.value });
    };

    private filterVariableGroups = (groups: VariableGroup[], query: string): VariableGroup[] => {
        if (!query.trim()) {
            return groups;
        }
        
        const lowerQuery = query.toLowerCase();
        return groups.filter(vg => 
            vg.name.toLowerCase().includes(lowerQuery) ||
            (vg.description && vg.description.toLowerCase().includes(lowerQuery))
        );
    };

    render() {
        const { loading, error, treeRoot, variableGroups, viewMode, searchQuery } = this.state;
        const filteredGroups = this.filterVariableGroups(variableGroups, searchQuery);
        const filteredTreeRoot = searchQuery.trim() ? 
            VariableGroupService.buildHierarchy(filteredGroups) : treeRoot;

        if (loading) {
            return (
                <div className="library-hub-container">
                    <Card className="flex-grow">
                        <div className="loading-container">
                            <Spinner size={SpinnerSize.large} label="Loading variable groups..." />
                        </div>
                    </Card>
                </div>
            );
        }

        if (error) {
            return (
                <div className="library-hub-container">
                    <MessageCard
                        severity={MessageCardSeverity.Error}
                    >
                        {error}
                    </MessageCard>
                </div>
            );
        }

        if (!treeRoot || treeRoot.children.size === 0) {
            return (
                <div className="library-hub-container">
                    <MessageCard
                        severity={MessageCardSeverity.Info}
                    >
                        No variable groups found in this project.
                    </MessageCard>
                </div>
            );
        }

        return (
            <div className="library-hub-container">
                <div className="library-hub-header">
                    <div className="header-content">
                        <div>
                            <h2>Library - Variable Groups</h2>
                            <div className="subtitle">
                                {filteredGroups.length} of {variableGroups.length} variable group{variableGroups.length !== 1 ? 's' : ''}
                                {searchQuery && filteredGroups.length !== variableGroups.length && ' (filtered)'}
                            </div>
                        </div>
                        <div className="header-actions">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search variable groups..."
                                value={searchQuery}
                                onChange={this.handleSearchChange}
                            />
                            <div className="view-toggle">
                                <button 
                                    className={`toggle-button ${viewMode === 'hierarchy' ? 'active' : ''}`}
                                    onClick={this.toggleViewMode}
                                    title="Hierarchy View"
                                >
                                    📑 Hierarchy
                                </button>
                                <button 
                                    className={`toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={this.toggleViewMode}
                                    title="List View"
                                >
                                    ☰ List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tree-container">
                    {viewMode === 'hierarchy' ? (
                        <HierarchicalTree
                            root={filteredTreeRoot!}
                            onVariableGroupClick={this.handleVariableGroupClick}
                        />
                    ) : (
                        <div className="hierarchical-tree-table">
                                <div className="table-header">
                                    <div className="table-header-cell name-column">Name</div>
                                    <div className="table-header-cell date-column">Date modified</div>
                                    <div className="table-header-cell modified-by-column">Modified by</div>
                                    <div className="table-header-cell description-column">Description</div>
                                    <div className="table-header-cell variables-column">Variables</div>
                                </div>
                                <div className="table-body">
                                    {filteredGroups
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(vg => {
                                            const variableCount = Object.keys(vg.variables || {}).length;
                                            const modifiedDate = vg.modifiedOn 
                                                ? new Date(vg.modifiedOn).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                  })
                                                : '';
                                            const modifiedBy = vg.modifiedBy?.displayName || '';

                                            return (
                                                <div 
                                                    key={vg.id}
                                                    className="table-row variable-group-row"
                                                    onClick={(e) => {
                                                            const openInNewTab = e.ctrlKey || e.metaKey;
                                                            this.handleVariableGroupClick(vg, openInNewTab);
                                                        }}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            this.handleVariableGroupClick(vg, true);
                                                        }}
                                                        onMouseDown={(e) => {
                                                            // Handle middle-button reliably on mouse down: open in new tab
                                                            if (e.button === 1) {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                this.handleVariableGroupClick(vg, true);
                                                            }
                                                        }}
                                                >
                                                    <div className="table-cell name-column" style={{ paddingLeft: '16px' }}>

                                                        <span className="node-name">{vg.name}</span>
                                                        <span
                                                            className="copy-icon"
                                                            style={{ 
                                                                fontSize: '14px', 
                                                                marginLeft: '8px',
                                                                cursor: 'pointer',
                                                                opacity: 0
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const copyText = (text: string) => {
                                                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                                                        navigator.clipboard.writeText(text).catch(() => {
                                                                            // Fallback
                                                                            try {
                                                                                const textArea = document.createElement('textarea');
                                                                                textArea.value = text;
                                                                                textArea.style.position = 'fixed';
                                                                                textArea.style.left = '-999999px';
                                                                                document.body.appendChild(textArea);
                                                                                textArea.select();
                                                                                document.execCommand('copy');
                                                                                document.body.removeChild(textArea);
                                                                            } catch (err) {
                                                                                // Silent fail
                                                                            }
                                                                        });
                                                                    } else {
                                                                        // Use fallback
                                                                        try {
                                                                            const textArea = document.createElement('textarea');
                                                                            textArea.value = text;
                                                                            textArea.style.position = 'fixed';
                                                                            textArea.style.left = '-999999px';
                                                                            document.body.appendChild(textArea);
                                                                            textArea.select();
                                                                            document.execCommand('copy');
                                                                            document.body.removeChild(textArea);
                                                                        } catch (err) {
                                                                            // Silent fail
                                                                        }
                                                                    }
                                                                };
                                                                copyText(vg.name);
                                                            }}
                                                            title="Copy name"
                                                        >
                                                            �
                                                        </span>
                                                    </div>
                                                    <div className="table-cell date-column">
                                                        {modifiedDate}
                                                    </div>
                                                    <div className="table-cell modified-by-column">
                                                        {modifiedBy}
                                                    </div>
                                                    <div className="table-cell description-column">
                                                        {vg.description || ''}
                                                    </div>
                                                    <div className="table-cell variables-column">
                                                        {variableCount}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                </div>
            </div>
        );
    }
}
