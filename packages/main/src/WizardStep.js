import UI5Element from "@ui5/webcomponents-base/dist/UI5Element.js";

/**
 * @public
 */
const metadata = {
	tag: "ui5-wizard-step",
	properties: /** @lends sap.ui.webcomponents.main.WizardStep.prototype */ {
		/**
		 * Defines the <code>text</code> of the step.
		 * <br><br>
		 *
		 * <b>Note:</b> the text is displayed in the <code>ui5-wizard</code> navigation header.
		 * @type {String}
		 * @defaultvalue ""
		 * @public
		 */
		text: {
			type: String,
		},

		/**
		 * Defines the <code>icon</code> of the step.
		 * <br><br>
		 *
		 * <b>Note:</b> the icon is displayed in the <code>ui5-wizard</code> navigation header.
		 * <br><br>
		 *
		 * The SAP-icons font provides numerous options.
		 * See all the available icons in the <ui5-link target="_blank" href="https://openui5.hana.ondemand.com/test-resources/sap/m/demokit/iconExplorer/webapp/index.html" class="api-table-content-cell-link">Icon Explorer</ui5-link>.
		 * @type {String}
		 * @defaultvalue ""
		 * @public
		 */
		icon: {
			type: String,
		},

		/**
		 * Defines if the step is <code>disabled</code>.
		 * <br><br>
		 *
		 * <b>Note:</b> The disabled step is displayed,
		 * but the user can't select the step by cliking or navigate to it with scrolling.
		 *
		 * @type {boolean}
		 * @defaultvalue false
		 * @public
		 */
		disabled: {
			type: Boolean,
		},

		/**
		 * Defines the step's <code>selected</code> state - the step that is currently active.
		 *
		 * @type {boolean}
		 * @defaultvalue false
		 * @public
		 */
		selected: {
			type: Boolean,
		},
	},
	slots: /** @lends sap.ui.webcomponents.main.WizardStep.prototype */ {
	},
	events: /** @lends sap.ui.webcomponents.main.WizardStep.prototype */ {
	},
};

/**
 * @class
 *
 * <h3 class="comment-api-title">Overview</h3>
 *
 * A component that represents a logical step as part of the <code>ui5-wizard</code>.
 * It is meant to aggregate arbitrary HTML elements that forms the content of a single step.
 *
 * <h3>Structure</h3>
 * <ul>
 * <li>Each wizard step has arbitrary content</li>
 * <li>Each wizard step might have an text - degined by the <code>text</code> property</li>
 * <li>Each wizard step might have an icon - degined by the <code>icon</code> property</li>
 * </ul>
 *
 * <h3>Usage</h3>
 * The <code>ui5-wizard-step</code> component should be used only as slot of the <code>ui5-wizard</code> component
 * and should not be used standalone.
 *
 * @constructor
 * @author SAP SE
 * @alias sap.ui.webcomponents.main.WizardStep
 * @extends UI5Element
 * @tagname ui5-wizard-step
 * @public
 */
class WizardStep extends UI5Element {
	static get metadata() {
		return metadata;
	}
}

WizardStep.define();

export default WizardStep;