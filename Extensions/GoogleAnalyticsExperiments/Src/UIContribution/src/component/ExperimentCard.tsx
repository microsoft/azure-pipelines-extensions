import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ISimpleListCell } from "azure-devops-ui/List";
import { MenuItemType } from "azure-devops-ui/Menu";
import {
  IStatusProps,
  Status,
  Statuses,
  StatusSize,
} from "azure-devops-ui/Status";
import {
  ColumnFill,
  ColumnMore,
  ColumnSelect,
  ISimpleTableCell,
  renderSimpleCell,
  TableColumnLayout,
} from "azure-devops-ui/Table";
import { Table } from "azure-devops-ui/Table";
import { css } from "azure-devops-ui/Util";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
// import "./iconFont.css";
import * as React from "react";
import { ExperimentCardInfo } from "../entity/ExperimentCardInfo";

interface IExperimentCardProps {
	experimentCardInfo: ExperimentCardInfo;
}

let additionalMetric: string ;

export class ExperimentCard extends React.Component<IExperimentCardProps, {}> {

    constructor(props) {
		super(props);
	}

    public render() {
		const cardInfo = this.props.experimentCardInfo;

		if (!cardInfo) {
			return;
		}

		additionalMetric = cardInfo.variationInfos[0].additionalMetricName;

		return (
            <div style={{ marginTop: "3%" }}>
                <Card
                    className="flex-grow bolt-table-card"
                    contentProps={{ contentPadding: false }}
                    titleProps={{ text: cardInfo.experimentName }}
                    headerCommandBarItems={this.commandBarItemsSimple(cardInfo)}
                    >
                    <Table
                        columns={this.fixedColumns()}
                        itemProvider={this.tableItemsNoIcons(cardInfo)}
                        role="table"
                    />
                </Card>
            </div>
        );
    }

    private commandBarItemsSimple = (cardInfo) => {
        const accountId = cardInfo.accountId;
        const profileId = cardInfo.profileId;
        const internalWebPropertyId = cardInfo.internalWebPropertyId;
        const experimentId = cardInfo.experimentId;
        const reportUrl = `https://analytics.google.com/analytics/web/#/siteopt-experiment/siteopt-detail/a${accountId}w${internalWebPropertyId}p${profileId}/_r.drilldown=analytics.gwoExperimentId:${experimentId}&createExperimentWizard.experimentId=${experimentId}&rel="noopener"`;
        const result = [
            {
                iconProps: {
                    iconName: "Share",
                },
                id: "testCreate",
                important: true,
                onActivate: () => {
                    const temp = window.open(reportUrl, "_blank");
                    if (temp) {
                        temp.opener = null;
                    }
                },
                text: "View report in Analytics",
                tooltipProps: {
                    text: "Custom tooltip for create",
                },
            },
        ];
        return result;
    }

    private tableItemsNoIcons = (cardInfo) => {
        return new ArrayItemProvider(
    		cardInfo.variationInfos.map((variation) => {
    			const result = {
    				Variation: variation.name,
    				Sessions: variation.sessions,
    				Pageviews: variation.pageViews,
    				BounceRate: variation.bounceRate,
    				additionalMetric: variation.additionalMetric,
    			};
    			return result;
    	    }),
    	);
    }

	private fixedColumns = () => {
         const result = [
        	  {
        	    columnLayout: TableColumnLayout.singleLinePrefix,
        	    id: "Variation",
        	    name: "Variation",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-200),
        	  },
        	  {
        	    id: "Sessions",
        	    name: "Sessions",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
        	  {
        	    columnLayout: TableColumnLayout.none,
        	    id: "Pageviews",
        	    name: "Pageviews",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
        	  {
        	    columnLayout: TableColumnLayout.none,
        	    id: "BounceRate",
        	    name: "Bounce Rate",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
        	  {
        	    columnLayout: TableColumnLayout.none,
        	    id: "additionalMetric",
        	    name: additionalMetric,
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
    	      ColumnFill,
	     ];

         return result;
    }

    private fixedHeader = () => {
         const result = [
        	  {
        	    columnLayout: TableColumnLayout.singleLinePrefix,
        	    id: "Variation",
        	    name: "Variation",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-200),
        	  },
        	  {
        	    id: "Sessions",
        	    name: "Sessions",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
        	  {
        	    columnLayout: TableColumnLayout.none,
        	    id: "Pageviews",
        	    name: "Pageviews",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
        	  {
        	    columnLayout: TableColumnLayout.none,
        	    id: "BounceRate",
        	    name: "Bounce Rate",
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
        	  {
        	    columnLayout: TableColumnLayout.none,
        	    id: "additionalMetric",
        	    name: additionalMetric,
        	    readonly: true,
        	    renderCell: renderSimpleCell,
        	    width: new ObservableValue(-100),
        	  },
    	      ColumnFill,
	     ];

         return result;
    }
}
