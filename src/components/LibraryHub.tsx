import * as React from "react";
import "azure-devops-ui/Core/override.css";
import { Card } from "azure-devops-ui/Card";
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
import "./LibraryHub.css";

interface LibraryHubState {
    loading: boolean;
    error: string | null;
    variableGroups: VariableGroup[];
    treeRoot: TreeNode | null;
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
            treeRoot: null
        };
    }

    async componentDidMount() {
        try {
            await SDK.ready();
            
            console.log('SDK Ready');
            console.log('Host:', SDK.getHost());
            console.log('User:', SDK.getUser());

            // Proje bilgilerini al
            const projectService = await SDK.getService<IProjectPageService>(
                CommonServiceIds.ProjectPageService
            );
            const project = await projectService.getProject();
            
            if (!project) {
                throw new Error("Project information not available");
            }

            this.projectName = project.name;
            console.log('Project name:', this.projectName);
            
            // Organization URL'ini al
            const hostContext = SDK.getHost();
            this.organizationUrl = `https://${hostContext.name}.visualstudio.com`;
            console.log('Organization URL:', this.organizationUrl);

            // Variable Group'ları çek
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
            console.log('Loading variable groups for project:', this.projectName);
            
            // RestClient'ı project context ile oluştur
            const client = getClient(TaskAgentRestClient);
            
            // Project name yerine project ID kullanmayı deneyelim
            const projectService = await SDK.getService<IProjectPageService>(
                CommonServiceIds.ProjectPageService
            );
            const project = await projectService.getProject();
            
            if (!project || !project.id) {
                throw new Error("Project information not available");
            }
            
            console.log('Using project ID:', project.id);
            
            const vgs = await client.getVariableGroups(project.id);

            console.log('Variable groups loaded:', vgs.length);

            const variableGroups: VariableGroup[] = vgs.map(vg => ({
                id: vg.id!,
                name: vg.name!,
                description: vg.description || "",
                type: vg.type || "",
                variables: vg.variables
            }));

            // Hiyerarşik yapıyı oluştur
            const treeRoot = VariableGroupService.buildHierarchy(variableGroups);

            this.setState({
                loading: false,
                variableGroups,
                treeRoot
            });

        } catch (error) {
            console.error('Error loading variable groups:', error);
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
            window.open(url, '_blank');
        } else {
            const navService = await SDK.getService<IHostNavigationService>(
                CommonServiceIds.HostNavigationService
            );
            navService.navigate(url);
        }
    };

    render() {
        const { loading, error, treeRoot } = this.state;

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
                <Card className="flex-grow">
                    <div className="library-hub-content">
                        <h2 className="library-hub-title">Variable Groups</h2>
                        <HierarchicalTree
                            root={treeRoot}
                            onVariableGroupClick={this.handleVariableGroupClick}
                        />
                    </div>
                </Card>
            </div>
        );
    }
}
