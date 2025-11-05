import { VariableGroup, TreeNode } from '../types/types';

export class VariableGroupService {
    
    /**
     * Variable Group isimlerini '-' karakterine göre parse ederek ağaç yapısı oluşturur
     */
    public static buildHierarchy(variableGroups: VariableGroup[]): TreeNode {
        const root: TreeNode = {
            name: 'root',
            fullPath: '',
            children: new Map(),
            isExpanded: true
        };

        variableGroups.forEach(vg => {
            const parts = vg.name.split('-');
            let currentNode = root;

            parts.forEach((part, index) => {
                const isLastPart = index === parts.length - 1;
                
                if (!currentNode.children.has(part)) {
                    const fullPath = parts.slice(0, index + 1).join('-');
                    const newNode: TreeNode = {
                        name: part,
                        fullPath: fullPath,
                        children: new Map(),
                        isExpanded: false
                    };

                    if (isLastPart) {
                        newNode.variableGroup = vg;
                    }

                    currentNode.children.set(part, newNode);
                }

                currentNode = currentNode.children.get(part)!;
            });
        });

        return root;
    }

    /**
     * Azure DevOps variable group detay sayfası URL'ini oluşturur
     */
    public static getVariableGroupUrl(
        organizationUrl: string,
        projectName: string,
        variableGroupId: number
    ): string {
        return `${organizationUrl}/${projectName}/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=${variableGroupId}`;
    }

    /**
     * Tüm Variable Group'ları getir
     */
    public static async fetchVariableGroups(
        organizationUrl: string,
        projectName: string,
        accessToken: string
    ): Promise<VariableGroup[]> {
        const apiUrl = `${organizationUrl}/${projectName}/_apis/distributedtask/variablegroups?api-version=7.0`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch variable groups: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    }
}
