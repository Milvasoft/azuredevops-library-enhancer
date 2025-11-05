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

        // Two-pass algorithm: First create all nodes, then check parent variable groups
        variableGroups.forEach(vg => {
            const parts = vg.name.split('-');
            let currentNode = root;

            parts.forEach((part, index) => {
                const isLastPart = index === parts.length - 1;
                const fullPath = parts.slice(0, index + 1).join('-');
                
                if (!currentNode.children.has(part)) {
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
                } else if (isLastPart) {
                    const existingNode = currentNode.children.get(part)!;
                    if (!existingNode.variableGroup) {
                        existingNode.variableGroup = vg;
                    }
                }

                currentNode = currentNode.children.get(part)!;
            });
        });

        // Second pass: If a parent has both a variable group and children,
        // add the parent as its own child
        const addParentAsChild = (node: TreeNode) => {
            node.children.forEach((childNode) => {
                // If this child is both a parent and a variable group
                if (childNode.children.size > 0 && childNode.variableGroup) {
                    // Add itself among its own children
                    const selfNode: TreeNode = {
                        name: childNode.name,
                        fullPath: childNode.fullPath,
                        children: new Map(),
                        isExpanded: false,
                        variableGroup: childNode.variableGroup
                    };
                    
                    // Create new Map and add self node at the beginning
                    const newChildren = new Map<string, TreeNode>();
                    newChildren.set(childNode.name, selfNode);
                    childNode.children.forEach((child, key) => {
                        newChildren.set(key, child);
                    });
                    childNode.children = newChildren;
                    
                    // Parent is now just a folder
                    delete childNode.variableGroup;
                }
                
                // Continue recursively
                addParentAsChild(childNode);
            });
        };
        
        addParentAsChild(root);

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
