import * as vscode from 'vscode';
import { StateService } from './services/stateService';
import { registerInitializeCommand } from './commands/initializeCommand';
import { registerDestroyCommand } from './commands/destroyCommand';
import { registerExportProjectCommand } from './commands/exportProjectCommand';
import { registerImportProjectCommand } from './commands/importProjectCommand';
import { registerCopyPromptCommand } from './commands/copyPromptCommand';
import { registerOpenToolboxCommand } from './commands/openToolboxCommand';
import { registerCreateToolboxCommand } from './commands/createToolboxCommand';
import { registerUseExistingToolboxCommand } from './commands/useExistingToolboxCommand';
import { registerSetDefaultToolboxCommand } from './commands/setDefaultToolboxCommand';
import { registerChangeToolboxCommand } from './commands/changeToolboxCommand';
import { registerRepairToolboxLinkCommand } from './commands/repairToolboxLinkCommand';
import { registerExportToolboxCommand } from './commands/exportToolboxCommand';
import { registerImportToolboxCommand } from './commands/importToolboxCommand';

export function activate(context: vscode.ExtensionContext) {
  const state = new StateService(context);

  context.subscriptions.push(
    registerInitializeCommand(context, state),
    registerDestroyCommand(context, state),
    registerExportProjectCommand(context, state),
    registerImportProjectCommand(context, state),
    registerCopyPromptCommand(context, state),
    registerOpenToolboxCommand(context, state),
    registerCreateToolboxCommand(context, state),
    registerUseExistingToolboxCommand(context, state),
    registerSetDefaultToolboxCommand(context, state),
    registerChangeToolboxCommand(context, state),
    registerRepairToolboxLinkCommand(context, state),
    registerExportToolboxCommand(context, state),
    registerImportToolboxCommand(context, state)
  );
}

export function deactivate() {}
