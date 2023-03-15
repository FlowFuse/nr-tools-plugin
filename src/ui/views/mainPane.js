import RED from 'node-red'
import $ from 'jquery'
import { snapshotSection } from './snapshotSection'
import * as events from '../events'

events.on('instance', async (_instance) => {
    $('.ff-nr-tools-pane-stack').toggle(!!_instance)
    $('.ff-nr-tools-pane-placeholder').toggle(!_instance)
})

const mainPane = {
    id: 'main',
    onshow: () => {},
    content: () => {
        const pane = $(`
<div class="ff-nr-tools-pane">
    <div class="ff-nr-tools-pane ff-nr-tools-pane-placeholder ff-nr-tools-pane-centered">
        <i>Select a Team and Instance</i>
    </div>
    <div class="ff-nr-tools-pane-stack"></div>
</div>`)

        const sections = RED.stack.create({
            container: pane.find('.ff-nr-tools-pane-stack'),
            singleExpanded: true
        })
        snapshotSection(sections)
        return pane
    }
}

export {
    mainPane
}
