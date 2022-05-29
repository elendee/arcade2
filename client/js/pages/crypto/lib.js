import env from '../../env.js?v=24'





const Transaction = ( props, groupProps, fcanvas ) => {
	const fabricObj = new fabric.Circle({
		radius: 7,
		fill: props.transaction.buy ? 'green' : 'red',
		originX: 'center',
		originY: 'center',
		selectable: env.LOCAL,
	})
	const line = new fabric.Line( [ fabricObj.left, 0, fabricObj.left, fcanvas.height ], {
		angle: 0,
		hasControls: false,
		selectable: env.LOCAL,
		stroke: 'lightgrey',
		strokeWidth: 2,
	})
	const group = new fabric.Group( [line, fabricObj], groupProps )
	group.originX = 'center'
	group.myProps = props
	group.myProps.type = 'transaction'
	group.draggable = false

	console.log( props, groupProps )

	return group
}







const DataPoint = ( fabricObj, props ) => {
	fabricObj.myProps = {}
	fabricObj.draggable = false
	for( const key in props ){
		fabricObj.myProps[ key ] = props[ key ]
	}
	fabricObj.myProps.type = 'datapoint'
	return fabricObj
}






const render_trade = ( fcanvas, transaction ) => {

	let existingNode
	for( const obj of fcanvas.getObjects() ){
		if( obj.myProps.timestamp && obj.myProps.timestamp === transaction.timestamp ){
			existingNode = obj
			break;
		}
	}
	if( !existingNode ){
		console.log('no node found to render trade to: ', transaction )
		return
	}

	console.log('t: ', transaction )

	const t = Transaction({ // myProps
		transaction: transaction,
		hover: (() => {
			
			let html =''
			for( const key in transaction ){
				if( key === 'buy' ){
					html += '<b>type: </b>' + ( transaction[ key ] ? 'purchase' : 'sell' ) + '<br>'
				}else{
					html += '<b>' + key + ': </b>' + transaction[ key ] + '<br>'
				}
			}
			html += '<div class="clarification"><b>ctrl + click</b> to remove trade</div>'

			return html

		})(),
	}, { // Group props
		top: 5, // existingNode.top
		left: existingNode.left,
		// originX: 'center',
		// originY: 'center',
		selectable: env.LOCAL,
	}, fcanvas )

	fcanvas.add( t )
	fcanvas.requestRenderAll()

}








export {
	render_trade,
	Transaction,
	DataPoint,
}