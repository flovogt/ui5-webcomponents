import UI5Element from "@ui5/webcomponents-base/dist/UI5Element.js";
import litRender from "@ui5/webcomponents-base/dist/renderer/LitRenderer.js";
import ItemNavigation from "@ui5/webcomponents-base/dist/delegate/ItemNavigation.js";
import NavigationMode from "@ui5/webcomponents-base/dist/types/NavigationMode.js";
import ResizeHandler from "@ui5/webcomponents-base/dist/delegate/ResizeHandler.js";
import { isPhone } from "@ui5/webcomponents-base/dist/Device.js";
import WizardTemplate from "./generated/templates/WizardTemplate.lit.js";
import WizardTab from "./WizardTab.js";
import WizardStep from "./WizardStep.js";

// Styles
import WizardCss from "./generated/themes/Wizard.css.js";

/**
 * @public
 */
const metadata = {
	tag: "ui5-wizard",
	managedSlots: true,
	properties: /** @lends sap.ui.webcomponents.main.Wizard.prototype */ {
		/**
		 * Defines if the component width is under the phone breakpoint.
		 * @private
		 */
		phoneSize: {
			type: Boolean,
		},
	},
	slots: /** @lends sap.ui.webcomponents.main.Wizard.prototype */ {
		/**
		 * Defines the steps.
		 * <br><br>
		 * <b>Note:</b> Use the available <code>ui5-wizard-step</code> component.
		 *
		 * @type {HTMLElement[]}
		 * @public
		 * @slot
		 */
		"default": {
			propertyName: "steps",
			type: HTMLElement,
			"individualSlots": true,
			listenFor: { include: ["*"] },
		},
	},
	events: /** @lends sap.ui.webcomponents.main.Wizard.prototype */ {
		/**
		 * Fired when selection is changed by user interaction - either with scrolling,
		 * or by clicking on the steps within the component header.
		 *
		 * @event sap.ui.webcomponents.main.Wizard#selection-change
		 * @param {HTMLElement} selectedStep the newly selected step
		 * @param {HTMLElement} previouslySelectedStep the previously selected step
		 * @public
		 */
		"selection-change": {
			detail: {
				selectedStep: { type: HTMLElement },
				previouslySelectedStep: { type: HTMLElement },
			},
		},
	},
};

/**
 * @class
 *
 * <h3 class="comment-api-title">Overview</h3>
 *
 * The <code>ui5-wizard</code> enables users to accomplish a single goal that consists of multiple dependable sub-tasks.
 * The component helps users complete a complex task by dividing it into sections and guiding the user through it.
 * It has two main areas - a navigation area at the top showing the step sequence and a content area below it.
 *
 * <h3>Structure</h3>
 * <h4>Navigation area</h4>
 * The top most area of the <code>ui5-wizard</code> is occupied by the navigation area.
 * It shows the sequence of steps, where the minimum recommended number of steps is 3.
 * <ul>
 * <li> Steps can have different visual representations - numbers or icons.
 * <li> Steps might have labels for better readability.</li>
 * <li> Steps are defined by using the <code>ui5-wizard-step</code> as slotted element within the <code>ui5-wizard</code></li>
 * </ul>
 *
 * <h4>Content</h4>
 * The content occupies the main part of the page. It can hold any type of HTML elements.
 * It's defined by using the <code>ui5-wizard-step</code> as slotted element within the <code>ui5-wizard</code>.
 *
 * <h3>Scrolling</h3>
 * The component handles user scrolling by selecting the closest step, based on the current scroll position
 * and scrolls to particular place, when the user clicks on the step within the header.
 * <br><br>
 *
 * <b>Important:</b> In order the component's scrolling behaviour to work, it has to be limited from the outside parent element in terms of height
 * or it has to be given absolute height. Otherwise, the component will be scrolled out with the entire page.
 *
 * <h4>Moving to next step</h4>
 * The <code>ui5-wizard-step</code> provides the necessary API and it's up to the user of the component to use it to move to the next step.
 * The user have to set its <code>selected</code> (and remove the <code>disabled</code> if set) property to true.
 * <br>
 *
 * The component will automatically scroll to the content of the newly selected step.
 * The Fiori 3 guidelines suggest having a button for moving to the next step upon click.
 * The user can place such a button inside the <code>ui5-wizard-step</code>, for example after its content,
 * and show/hide it when certain fields are filled or user defined criteria is met.
 *
 * <h3>Usage</h3>
 * <h4>When to use:</h4>
 * When the user has to accomplish a long set of tasks.
 * <h4>When not to use:</h4>
 * When the task has only two steps or less.
 *
 * <h3>ES6 Module Import</h3>
 * <code>import @ui5/webcomponents/dist/Wizard.js";</code> (includes <ui5-wizard-step>)
 *
 * @constructor
 * @author SAP SE
 * @alias sap.ui.webcomponents.main.Wizard
 * @extends UI5Element
 * @tagname ui5-wizard
 * @since 1.0.0-rc.10
 * @appenddocs WizardStep
 * @public
 */
class Wizard extends UI5Element {
	constructor() {
		super();

		// Stores the scroll offsets of the steps,
		// e.g. the steps' starting point.
		this.stepScrollOffsets = [];

		// Keeps track of the selected step index.
		this.selectedStepIndex = 0;

		// Indicates that selection will be changed
		// due to user click.
		this.selectionRequestedByClick = false;

		// Indicates that selection will be changed
		// due to user scroll.
		this.selectionRequestedByScroll = false;

		this.initItemNavigation();

		this._onResize = this.onResize.bind(this);
	}

	static get metadata() {
		return metadata;
	}

	static get render() {
		return litRender;
	}

	static get styles() {
		return WizardCss;
	}

	static get template() {
		return WizardTemplate;
	}

	static get dependencies() {
		return [WizardTab, WizardStep];
	}

	static get PHONE_BREAKPOINT() {
		return 559;
	}

	static get SCROLL_DEBOUNCE_RATE() {
		return 25;
	}

	static get CONTENT_TOP_OFFSET() {
		return 80;
	}

	onEnterDOM() {
		ResizeHandler.register(this, this._onResize);
	}

	onExitDOM() {
		ResizeHandler.deregister(this, this._onResize);
	}

	onBeforeRendering() {
		this.syncSelection();
	}

	onAfterRendering() {
		this.storeStepScrollOffsets();
		this.scrollToSelectedStep();
	}

	/**
	 * Normalizes the step selection as follsows:
	 * (1) If no selected is provided - the first step is going to be selected.
	 * (2) If the selected steps are more than one - the first step is going to be selected.
	 * (3) If the selected step is also disabled - the first step is going to be selected.
	 * @private
	 */
	syncSelection() {
		if (this.stepsCount === 0) {
			return;
		}

		// If no selected steps or in case of multiple selected steps -> select the first step
		// If one step is defined as selected, but it is disabled -> select the first step
		if (this.selectedStepsCount === 0 || this.selectedStepsCount > 1 || this.selectedStep.disabled) {
			this.deselectAll();
			this.selectFirstStep();
			return;
		}

		this.selectedStepIndex = this.getSelectedStepIndex();
	}

	/**
	 * Selectes the firt step.
	 * @private
	 */
	selectFirstStep() {
		this.slottedSteps[0].selected = true;
		this.slottedSteps[0].disabled = false;
		this.selectedStepIndex = 0;
	}

	/**
	 * Deselects all steps.
	 * @private
	 */
	deselectAll() {
		this.slottedSteps.forEach(step => {
			step.selected = false;
		});
	}

	/**
	 * Stores the scroll offsets of the steps,
	 * e.g. the steps' starting point.
	 * @private
	 */
	storeStepScrollOffsets() {
		this.stepScrollOffsets = this.enabledSteps.map(step => {
			const contentItem = this.getStepWrapperByRefId(step._id);
			return contentItem.offsetTop + contentItem.offsetHeight - Wizard.CONTENT_TOP_OFFSET;
		});
	}

	/**
	 * Handles user click on steps' tabs within the header.
	 * <b>Note:</b> the handler is bound in the template.
	 * @param {Event} event
	 * @private
	 */
	onSelectionChangeRequested(event) {
		this.selectionRequestedByClick = true;
		this.changeSelectionByStepClick(event.target);
	}

	/**
	 * Called upon <code>onSelectionChangeRequested</code>.
	 * Selects the external step (ui5-wizard-step),
	 * based on the clicked step in the header (ui5-wizard-tab).
	 * @param {HTMLElement} stepInHeader the step equivalent in the header
	 * @private
	 */
	changeSelectionByStepClick(stepInHeader) {
		const stepRefId = stepInHeader.getAttribute("data-ui5-content-ref-id");
		const selectedStep = this.selectedStep;
		const stepToSelect = this.getStepByRefId(stepRefId);

		// If the currently selected (active) step is clicked,
		// just scroll to its starting point and stop.
		if (selectedStep === stepToSelect) {
			this.scrollToContentItem(this.selectedStepIndex);
			return;
		}

		// Change selection and fire "selection-change".
		const newlySelectedIndex = this.slottedSteps.indexOf(stepToSelect);
		this.switchSelectionFromOldToNewStep(selectedStep, stepToSelect, newlySelectedIndex);
	}

	/**
	 * Handles user scrolling with debouncing.
	 * <b>Note:</b> the handler is bound in the template.
	 * @param {Event} event
	 * @private
	 */
	onScroll(event) {
		if (this.selectionRequestedByClick) {
			this.selectionRequestedByClick = false;
			return;
		}

		this.debounce(this.changeSelectionByScroll.bind(this, event.target.scrollTop), Wizard.SCROLL_DEBOUNCE_RATE);
	}

	/**
	 * Handles when a step in the header is focused in order to update the <code>ItemNavigation</code>.
	 * <b>Note:</b> the handler is bound in the template.
	 * @param {Event} event
	 * @private
	 */
	onStepInHeaderFocused(event) {
		this._itemNavigation.update(event.target);
	}

	/**
	 * Handles component resize to hide steps' separators and texts
	 * to ensure more space.
	 * @param {Event} event
	 * @private
	 */
	onResize() {
		const width = this.getBoundingClientRect().width;
		this.phoneSize = width <= Wizard.PHONE_BREAKPOINT;
	}

	/**
	 * Called upon <code>onScroll</code>.
	 * Selects the closest step, based on the user scroll position.
	 * @param {Integer} scrollPos the current scroll position
	 * @private
	 */
	changeSelectionByScroll(scrollPos) {
		const newlySelectedIndex = this.getClosestStepByScrollPos(scrollPos);

		// Skip if already selected - stop.
		if (this.selectedStepIndex === newlySelectedIndex) {
			return;
		}

		// If the calculated index is in range,
		// change selection and fire "selection-change".
		if (newlySelectedIndex >= 0 && newlySelectedIndex <= this.stepsCount - 1) {
			const stepToSelect = this.slottedSteps[newlySelectedIndex];
			this.switchSelectionFromOldToNewStep(this.selectedStep, stepToSelect, newlySelectedIndex);
			this.selectionRequestedByScroll = true;
		}
	}

	get _stepsInHeader() {
		return this.getStepInfo();
	}

	get _steps() {
		const lastEnabledStepIndex = this.getLastEnabledStepIndex();

		return this.steps.map((step, idx) => {
			step.stretch = idx === lastEnabledStepIndex;
			return step;
		});
	}

	get stepsCount() {
		return this.slottedSteps.length;
	}

	get selectedStep() {
		if (this.selectedSteps.length) {
			return this.selectedSteps[0];
		}

		return null;
	}

	get selectedSteps() {
		return this.slottedSteps.filter(step => step.selected);
	}

	get enabledSteps() {
		return this.slottedSteps.filter(step => !step.disabled);
	}

	get selectedStepsCount() {
		return this.slottedSteps.filter(step => step.selected).length;
	}

	get slottedSteps() {
		return this.getSlottedNodes("steps");
	}

	get contentDOM() {
		return this.shadowRoot.querySelector(`.ui5-wiz-content`);
	}

	get stepsInHeaderDOM() {
		return Array.from(this.shadowRoot.querySelectorAll("ui5-wizard-tab"));
	}

	get enabledStepsInHeaderDOM() {
		return this.stepsInHeaderDOM.filter(step => !step.disabled);
	}

	get phoneMode() {
		return this.phoneSize || isPhone();
	}

	/**
	 * Returns an array of data objects, based on the user defined steps
	 * to later build the steps (tabs) within the header.
	 * @returns {Array<Object>}
	 * @private
	 */
	getStepInfo() {
		const lastEnabledStepIndex = this.getLastEnabledStepIndex();

		return this.steps.map((step, idx, arr) => {
			const hideSeparator = (idx === arr.length - 1) || this.phoneMode;

			return {
				icon: step.icon,
				text: this.phoneMode ? "" : step.text,
				initials: idx + 1,
				selected: step.selected,
				disabled: step.disabled,
				hideSeparator,
				activeSeparator: idx < lastEnabledStepIndex,
				pos: idx + 1,
				size: arr.length,
				refStepId: step._id,
				tabIndex: this.selectedStepIndex === idx ? "0" : "-1",
			};
		});
	}

	getSelectedStepIndex() {
		if (this.selectedStep) {
			return this.slottedSteps.indexOf(this.selectedStep);
		}
		return 0;
	}

	getLastEnabledStepIndex() {
		const enabledSteps = this.enabledSteps;

		if (enabledSteps.length) {
			return enabledSteps.length - 1;
		}

		return 0;
	}

	getStepByRefId(refId) {
		return this.slottedSteps.find(step => step._id === refId);
	}

	getStepWrapperByRefId(refId) {
		return this.shadowRoot.querySelector(`[data-ui5-content-item-ref-id=${refId}]`);
	}

	/**
	 * Determines the closest step index by given scroll position.
	 *
	 * @param {Integer} scrollPos scroll position
	 * @returns {Integer} closestStepIndex the closest step index
	 * @private
	 */
	getClosestStepByScrollPos(scrollPos) {
		// If the scroll position is found in the scroll offset storage,
		// the closest step has index bigger than the index of the found scroll offset by 1.
		if (this.stepScrollOffsets.indexOf(scrollPos) !== -1) {
			return this.stepScrollOffsets.indexOf(scrollPos) + 1;
		}

		// Continue searching the closest step index by:
		// (1) adding the current scroll position to the stepScrollOffsets array
		// (2) sorting the stepScrollOffsets array
		// (3) the index of the scroll position gives the index of closest step
		return [...this.stepScrollOffsets, scrollPos].sort(this.sortAccending).indexOf(scrollPos);
	}

	/**
	 * Scrolls to the content of the selected step
	 * and it is used in <code>onAfteRendering</cod>.
	 * @private
	 */
	scrollToSelectedStep() {
		if (!this.selectionRequestedByScroll) {
			this.scrollToContentItem(this.selectedStepIndex);
		}
		this.selectionRequestedByScroll = false;
	}

	/**
	 * Scrolls to the content item within the <code>ui5-wizard</code> shadowDOM
	 * by given step index.
	 *
	 * @private
	 * @param {Integer} stepIndex the index of a step
	 */
	scrollToContentItem(stepIndex) {
		if (stepIndex === 0) {
			this.contentDOM.scrollTop = 0;
			return;
		}

		this.contentDOM.scrollTop = this.stepScrollOffsets[stepIndex - 1];
	}

	/**
	 * Switches the selection from the old step to the newly selected step.
	 *
	 * @param {HTMLElement} selectedStep the old step
	 * @param {HTMLElement} stepToSelect the step to be selected
	 * @param {Integer} selectedStepIndex the index of the newly selected step
	 * @private
	 */
	switchSelectionFromOldToNewStep(selectedStep, stepToSelect, selectedStepIndex) {
		if (selectedStep && stepToSelect) {
			selectedStep.selected = false;
			stepToSelect.selected = true;

			this.fireEvent("selection-change", {
				selectedStep: stepToSelect,
				previouslySelectedStep: selectedStep,
			});

			this.selectedStepIndex = selectedStepIndex;
		}
	}

	/**
	 * Initializes the <code>ItemNavigation</code>
	 * that controls the navigation between the steps in the navigation header.
	 * @private
	 */
	initItemNavigation() {
		this._itemNavigation = new ItemNavigation(this, {
			navigationMode: NavigationMode.Horizontal,
		});

		this._itemNavigation.getItemsCallback = () => this.enabledStepsInHeaderDOM;
	}

	/**
	 * Delays function execution by given treshhold - used to delay the scroll event handling.
	 * @private
	 */
	debounce(fn, delay) {
		clearTimeout(this.debounceInterval);
		this.debounceInterval = setTimeout(() => {
			this.debounceInterval = null;
			fn();
		}, delay);
	}

	/**
	 * Sorter method for sorting an array accending.
	 * @private
	 */
	sortAccending(a, b) {
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	}
}

Wizard.define();

export default Wizard;